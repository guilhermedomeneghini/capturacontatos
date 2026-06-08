"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jobStore = void 0;
const crypto_1 = require("crypto");
class JobStore {
    jobs = new Map();
    create(query, limit) {
        const now = new Date().toISOString();
        const job = {
            id: (0, crypto_1.randomUUID)(),
            query,
            limit,
            status: "queued",
            progressMessage: "Busca adicionada a fila.",
            progressPercent: 0,
            leads: [],
            createdAt: now,
            updatedAt: now
        };
        this.jobs.set(job.id, job);
        return job;
    }
    get(id) {
        return this.jobs.get(id);
    }
    update(id, patch) {
        const current = this.jobs.get(id);
        if (!current) {
            return undefined;
        }
        const updated = {
            ...current,
            ...patch,
            updatedAt: new Date().toISOString()
        };
        this.jobs.set(id, updated);
        return updated;
    }
    complete(id, leads) {
        return this.update(id, {
            status: "completed",
            progressMessage: `Coleta concluida com ${leads.length} lead(s).`,
            progressPercent: 100,
            leads
        });
    }
    fail(id, error) {
        return this.update(id, {
            status: "failed",
            progressMessage: "Nao foi possivel concluir a coleta.",
            progressPercent: 100,
            error
        });
    }
}
exports.jobStore = new JobStore();
