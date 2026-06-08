const form = document.querySelector("#searchForm");
const queryInput = document.querySelector("#queryInput");
const limitInput = document.querySelector("#limitInput");
const searchButton = document.querySelector("#searchButton");
const csvButton = document.querySelector("#csvButton");
const jsonButton = document.querySelector("#jsonButton");
const statusTitle = document.querySelector("#statusTitle");
const statusMessage = document.querySelector("#statusMessage");
const progressBar = document.querySelector("#progressBar");
const resultsBody = document.querySelector("#resultsBody");
const resultCount = document.querySelector("#resultCount");

let activeJobId = "";
let pollTimer = 0;

if (window.lucide) {
  window.lucide.createIcons();
}

function setStatus(title, message, percent = 0, tone = "normal") {
  statusTitle.textContent = title;
  statusMessage.textContent = message;
  statusTitle.classList.toggle("is-error", tone === "error");
  statusTitle.classList.toggle("is-warning", tone === "warning");
  progressBar.style.width = `${Math.max(0, Math.min(percent, 100))}%`;
}

function setLoading(isLoading) {
  searchButton.disabled = isLoading;
  queryInput.disabled = isLoading;
  limitInput.disabled = isLoading;
}

function setExportEnabled(enabled) {
  csvButton.disabled = !enabled;
  jsonButton.disabled = !enabled;
}

function renderLeads(leads) {
  resultsBody.innerHTML = "";

  if (!leads.length) {
    resultsBody.innerHTML =
      '<tr class="empty-row"><td colspan="4">Nenhum lead encontrado para essa busca.</td></tr>';
    resultCount.textContent = "Nenhum lead coletado.";
    setExportEnabled(false);
    return;
  }

  const fragment = document.createDocumentFragment();

  leads.forEach((lead) => {
    const row = document.createElement("tr");

    row.append(
      createCell(lead.nome || "-"),
      createCell(lead.endereco || "-"),
      createWebsiteCell(lead.site),
      createCell(lead.telefone || "-")
    );

    fragment.append(row);
  });

  resultsBody.append(fragment);
  resultCount.textContent = `${leads.length} lead(s) coletado(s).`;
  setExportEnabled(true);
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function createWebsiteCell(value) {
  const cell = document.createElement("td");

  if (!value) {
    cell.textContent = "-";
    return cell;
  }

  const link = document.createElement("a");
  link.href = value;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = value.replace(/^https?:\/\//, "").replace(/\/$/, "");
  cell.append(link);
  return cell;
}

async function startSearch(event) {
  event.preventDefault();

  const query = queryInput.value.trim();
  const limit = Number(limitInput.value || 10);

  if (!query) {
    setStatus("Campo obrigatorio", "Informe nicho e cidade para iniciar a busca.", 0, "warning");
    queryInput.focus();
    return;
  }

  clearInterval(pollTimer);
  activeJobId = "";
  setLoading(true);
  setExportEnabled(false);
  renderLeads([]);
  setStatus("Iniciando busca", "Enviando dados para a automacao local.", 4);

  try {
    const response = await fetch("/api/leads/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query, limit })
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message || "Nao foi possivel iniciar a busca.");
    }

    activeJobId = payload.jobId;
    pollTimer = window.setInterval(pollJob, 1200);
    await pollJob();
  } catch (error) {
    setLoading(false);
    setStatus(
      "Erro ao iniciar",
      error instanceof Error ? error.message : "Erro inesperado ao iniciar a busca.",
      100,
      "error"
    );
  }
}

async function pollJob() {
  if (!activeJobId) {
    return;
  }

  try {
    const response = await fetch(`/api/leads/jobs/${activeJobId}`);
    const job = await response.json();

    if (!response.ok) {
      throw new Error(job.message || "Busca nao encontrada.");
    }

    setStatus(
      job.status === "completed"
        ? "Coleta concluida"
        : job.status === "failed"
          ? "Coleta interrompida"
          : "Coletando leads",
      job.error || job.progressMessage,
      job.progressPercent,
      job.status === "failed" ? "error" : "normal"
    );

    renderLeads(job.leads || []);

    if (job.status === "completed" || job.status === "failed") {
      clearInterval(pollTimer);
      setLoading(false);
      setExportEnabled(job.status === "completed" && (job.leads || []).length > 0);
    }
  } catch (error) {
    clearInterval(pollTimer);
    setLoading(false);
    setStatus(
      "Erro na consulta",
      error instanceof Error ? error.message : "Erro inesperado ao consultar progresso.",
      100,
      "error"
    );
  }
}

function downloadExport(format) {
  if (!activeJobId) {
    return;
  }

  window.location.href = `/api/leads/jobs/${activeJobId}/export/${format}`;
}

form.addEventListener("submit", startSearch);
csvButton.addEventListener("click", () => downloadExport("csv"));
jsonButton.addEventListener("click", () => downloadExport("json"));
