import { Request, Response } from "express";
import { jobStore } from "../services/jobStore";
import { startLeadSearchJob } from "../services/leadJobService";
import { leadsToCsv, leadsToJson, leadsToExcel } from "../utils/export";

const maxResultsLimit = 500;

function parseLimit(value: unknown): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 10;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), maxResultsLimit);
}

export function startSearch(req: Request, res: Response): void {
  const query = typeof req.body.query === "string" ? req.body.query.trim() : "";
  const limit = parseLimit(req.body.limit);

  if (!query) {
    res.status(400).json({
      message: "Informe um nicho e cidade para iniciar a busca."
    });
    return;
  }

  const jobId = startLeadSearchJob(query, limit);
  res.status(202).json({ jobId });
}

export function getJob(req: Request, res: Response): void {
  const job = jobStore.get(req.params.id);

  if (!job) {
    res.status(404).json({ message: "Busca nao encontrada." });
    return;
  }

  res.json(job);
}

export function exportCsv(req: Request, res: Response): void {
  const job = jobStore.get(req.params.id);

  if (!job) {
    res.status(404).json({ message: "Busca nao encontrada." });
    return;
  }

  const excelBuffer = leadsToExcel(job.leads);

  res.header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.header(
    "Content-Disposition",
    `attachment; filename="leads-${job.id}.xlsx"`
  );
  res.send(excelBuffer);
}

export function exportJson(req: Request, res: Response): void {
  const job = jobStore.get(req.params.id);

  if (!job) {
    res.status(404).json({ message: "Busca nao encontrada." });
    return;
  }

  res.header("Content-Type", "application/json; charset=utf-8");
  res.header(
    "Content-Disposition",
    `attachment; filename="leads-${job.id}.json"`
  );
  res.send(leadsToJson(job.leads));
}
