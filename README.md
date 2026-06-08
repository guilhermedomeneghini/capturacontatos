# Captar Contatos

Sistema local em Node.js + TypeScript para coletar leads publicos a partir de uma busca no Google Maps.

## Recursos

- Busca por nicho + cidade.
- Abertura automatizada do Google Maps com Playwright.
- Coleta de nome, endereco, site e telefone quando esses dados estiverem publicos.
- Limite configuravel de resultados.
- Progresso exibido na interface.
- Exportacao em CSV e JSON.
- Tratamento amigavel para bloqueios, captcha ou mudancas na estrutura do Google Maps.

## Como rodar

```bash
npm install
npm run dev
```

Depois acesse:

```text
http://localhost:3000
```

O `npm install` baixa o Chromium usado pelo Playwright. Se esse download for interrompido, rode:

```bash
npx playwright install chromium
```

Por padrao o navegador automatizado abre visivel. Para rodar em modo headless:

```bash
HEADLESS=true npm run dev
```

No Windows PowerShell:

```powershell
$env:HEADLESS="true"; npm run dev
```

## Estrutura

```text
src/
  server.ts
  routes/
  controllers/
  services/
  utils/
  types/
  public/
```

## Cuidados de uso

Use apenas para dados publicos. O sistema nao tenta burlar login, captcha, bloqueios ou areas restritas. Se o Google Maps bloquear, exigir captcha ou mudar a estrutura da pagina, a aplicacao interrompe a coleta e mostra uma mensagem amigavel.

## Melhorias futuras

- Salvar historico de buscas.
- Exportar para Excel.
- Adicionar SQLite.
- Adicionar tags e observacoes por lead.
- Integrar com CRM.
- Criar status em tempo real com Server-Sent Events.
- Adicionar filtros por cidade, nicho e data de coleta.
