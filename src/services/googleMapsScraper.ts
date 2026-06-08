import { Browser, Page, chromium } from "playwright";
import { Lead, LeadProgress } from "../types/lead";
import { randomDelay } from "../utils/delay";

type ProgressCallback = (progress: LeadProgress) => void;

const friendlyBlockedMessage =
  "Nao foi possivel concluir a coleta no momento. O Google Maps pode ter alterado sua estrutura ou bloqueado temporariamente a automacao.";

function normalizeText(value?: string | null): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function removeLabel(value: string): string {
  return normalizeText(
    value
      .replace(/^(Endereco|Endereço|Address|Telefone|Phone|Website|Site)\s*:\s*/i, "")
      .replace(/^(Copiar|Copy|Abrir|Open)\s+/i, "")
  );
}

function buildMapsSearchUrl(query: string): string {
  const encodedQuery = encodeURIComponent(query.trim()).replace(/%20/g, "+");
  return `https://www.google.com/maps/search/${encodedQuery}`;
}

function dedupeLeads(leads: Lead[]): Lead[] {
  const unique = new Map<string, Lead>();

  for (const lead of leads) {
    const key = `${lead.nome}|${lead.endereco}|${lead.telefone}`.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, lead);
    }
  }

  return [...unique.values()];
}

async function getFirstText(page: Page, selectors: string[]): Promise<string> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      continue;
    }

    const ariaLabel = await locator.getAttribute("aria-label").catch(() => null);
    const text = await locator.textContent().catch(() => null);
    const value = removeLabel(ariaLabel || text || "");

    if (value) {
      return value;
    }
  }

  return "";
}

async function getWebsite(page: Page): Promise<string> {
  const selectors = [
    'a[data-item-id="authority"]',
    'a[aria-label^="Website"]',
    'a[aria-label^="Site"]',
    'a[data-tooltip*="website" i]',
    'a[data-tooltip*="site" i]'
  ];

  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      continue;
    }

    const href = await locator.getAttribute("href").catch(() => null);
    const cleaned = cleanWebsiteUrl(href);
    if (cleaned) {
      return cleaned;
    }
  }

  return "";
}

function cleanWebsiteUrl(href?: string | null): string {
  if (!href) {
    return "";
  }

  try {
    const parsed = new URL(href);

    if (parsed.hostname.includes("google.") && parsed.searchParams.has("q")) {
      return parsed.searchParams.get("q") ?? "";
    }

    if (parsed.hostname.includes("google.") || parsed.hostname.includes("gstatic.")) {
      return "";
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return href;
  }
}

async function detectCaptchaOrBlock(page: Page): Promise<void> {
  const url = page.url().toLowerCase();

  if (url.includes("/sorry/") || url.includes("captcha") || url.includes("recaptcha")) {
    throw new Error(friendlyBlockedMessage);
  }

  const pageText = normalizeText(await page.locator("body").innerText().catch(() => ""));
  const blockedPatterns = [
    /unusual traffic/i,
    /captcha/i,
    /nao sou um robo/i,
    /não sou um robô/i,
    /verify you are human/i,
    /verifique se voce/i,
    /verifique se você/i
  ];

  // Stop here instead of attempting to bypass platform limitations.
  if (blockedPatterns.some((pattern) => pattern.test(pageText))) {
    throw new Error(friendlyBlockedMessage);
  }
}

async function acceptConsentIfVisible(page: Page): Promise<void> {
  const labels = [
    "Aceitar tudo",
    "Accept all",
    "I agree",
    "Concordo",
    "Aceptar todo"
  ];

  for (const label of labels) {
    const button = page.getByRole("button", { name: label }).first();
    if ((await button.count()) > 0) {
      await button.click({ timeout: 3000 }).catch(() => undefined);
      await randomDelay(700, 1200);
      return;
    }
  }
}

async function collectResultLinks(
  page: Page,
  limit: number,
  onProgress: ProgressCallback
): Promise<string[]> {
  const links = new Set<string>();
  let roundsWithoutNewLinks = 0;

  const hasListOrLinks = await page
    .locator('div[role="feed"], a[href*="/maps/place/"]')
    .first()
    .waitFor({ timeout: 30000 })
    .then(() => true)
    .catch(() => false);

  if (!hasListOrLinks) {
    return [];
  }

  for (let attempt = 1; attempt <= 40 && links.size < limit; attempt += 1) {
    await detectCaptchaOrBlock(page);

    const currentLinks = await page
      .locator('a[href*="/maps/place/"]')
      .evaluateAll((anchors) =>
        anchors
          .map((anchor) => (anchor as HTMLAnchorElement).href)
          .filter((href) => href.includes("/maps/place/"))
      )
      .catch(() => []);

    const before = links.size;
    for (const link of currentLinks) {
      links.add(link);
      if (links.size >= limit) {
        break;
      }
    }

    onProgress({
      message: `Encontrando empresas na lista (${Math.min(links.size, limit)}/${limit}).`,
      percent: Math.min(35, 10 + Math.round((links.size / limit) * 25))
    });

    if (links.size === before) {
      roundsWithoutNewLinks += 1;
    } else {
      roundsWithoutNewLinks = 0;
    }

    if (roundsWithoutNewLinks >= 5) {
      break;
    }

    const feed = page.locator('div[role="feed"]').first();
    if ((await feed.count()) > 0) {
      await feed.evaluate((element) => element.scrollBy(0, element.scrollHeight));
    } else {
      await page.mouse.wheel(0, 1400);
    }

    await randomDelay();
  }

  return [...links].slice(0, limit);
}

async function extractLeadFromPlace(page: Page): Promise<Lead> {
  const nome = await getFirstText(page, [
    "h1.DUwDvf",
    "h1",
    '[role="heading"][aria-level="1"]'
  ]);

  const endereco = await getFirstText(page, [
    'button[data-item-id="address"]',
    'button[aria-label^="Endereco"]',
    'button[aria-label^="Endereço"]',
    'button[aria-label^="Address"]'
  ]);

  const telefone = await getFirstText(page, [
    'button[data-item-id^="phone:tel"]',
    'button[aria-label^="Telefone"]',
    'button[aria-label^="Phone"]'
  ]);

  const site = await getWebsite(page);

  return {
    nome,
    endereco,
    site,
    telefone
  };
}

export async function scrapeGoogleMaps(
  query: string,
  limit: number,
  onProgress: ProgressCallback
): Promise<Lead[]> {
  let browser: Browser | undefined;

  try {
    const headless = process.env.HEADLESS === "true";

    onProgress({
      message: "Abrindo navegador automatizado.",
      percent: 5
    });

    browser = await chromium.launch({
      headless,
      slowMo: headless ? 0 : 80
    });

    const context = await browser.newContext({
      locale: "pt-BR",
      viewport: { width: 1365, height: 900 }
    });
    const page = await context.newPage();
    const searchUrl = buildMapsSearchUrl(query);

    onProgress({
      message: "Acessando Google Maps com a pesquisa informada.",
      percent: 8
    });

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await acceptConsentIfVisible(page);
    await detectCaptchaOrBlock(page);
    await randomDelay(1300, 2200);

    if (page.url().includes("/maps/place/")) {
      onProgress({
        message: "Resultado unico encontrado. Coletando detalhes.",
        percent: 45
      });

      const lead = await extractLeadFromPlace(page);
      return lead.nome || lead.endereco || lead.telefone || lead.site ? [lead] : [];
    }

    const placeLinks = await collectResultLinks(page, limit, onProgress);
    const leads: Lead[] = [];

    if (placeLinks.length === 0) {
      onProgress({
        message: "Nenhum resultado foi encontrado para essa busca.",
        percent: 100
      });
      return [];
    }

    for (const [index, link] of placeLinks.entries()) {
      await detectCaptchaOrBlock(page);
      const current = index + 1;

      onProgress({
        message: `Coletando dados da empresa ${current}/${placeLinks.length}.`,
        percent: 35 + Math.round((current / placeLinks.length) * 55)
      });

      await page.goto(link, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page
        .locator("h1, [role='heading'][aria-level='1']")
        .first()
        .waitFor({ timeout: 15000 })
        .catch(() => undefined);
      await detectCaptchaOrBlock(page);
      await randomDelay();

      const lead = await extractLeadFromPlace(page);

      if (lead.nome || lead.endereco || lead.telefone || lead.site) {
        leads.push(lead);
      }
    }

    const uniqueLeads = dedupeLeads(leads);

    onProgress({
      message: "Finalizando e removendo duplicados.",
      percent: 96
    });

    return uniqueLeads.slice(0, limit);
  } catch (error) {
    if (error instanceof Error && error.message === friendlyBlockedMessage) {
      throw error;
    }

    throw new Error(friendlyBlockedMessage);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
