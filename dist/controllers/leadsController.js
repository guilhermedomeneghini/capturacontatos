"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSearch = startSearch;
exports.getJob = getJob;
exports.exportCsv = exportCsv;
exports.exportJson = exportJson;
const jobStore_1 = require("../services/jobStore");
const leadJobService_1 = require("../services/leadJobService");
const export_1 = require("../utils/export");
const maxResultsLimit = 500;
function parseLimit(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 10;
    }
    return Math.min(Math.max(Math.floor(parsed), 1), maxResultsLimit);
}
function startSearch(req, res) {
    const query = typeof req.body.query === "string" ? req.body.query.trim() : "";
    const limit = parseLimit(req.body.limit);
    if (!query) {
        res.status(400).json({
            message: "Informe um nicho e cidade para iniciar a busca."
        });
        return;
    }
    const jobId = (0, leadJobService_1.startLeadSearchJob)(query, limit);
    res.status(202).json({ jobId });
}
function getJob(req, res) {
    const job = jobStore_1.jobStore.get(req.params.id);
    if (!job) {
        res.status(404).json({ message: "Busca nao encontrada." });
        return;
    }
    res.json(job);
}
function exportCsv(req, res) {
    const job = jobStore_1.jobStore.get(req.params.id);
    if (!job) {
        res.status(404).json({ message: "Busca nao encontrada." });
        return;
    }
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="leads-${job.id}.csv"`);
    res.send(`\uFEFF${(0, export_1.leadsToCsv)(job.leads)}`);
}
function exportJson(req, res) {
    const job = jobStore_1.jobStore.get(req.params.id);
    if (!job) {
        res.status(404).json({ message: "Busca nao encontrada." });
        return;
    }
    res.header("Content-Type", "application/json; charset=utf-8");
    res.header("Content-Disposition", `attachment; filename="leads-${job.id}.json"`);
    res.send((0, export_1.leadsToJson)(job.leads));
}
