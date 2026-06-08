"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLeadSearchJob = startLeadSearchJob;
const jobStore_1 = require("./jobStore");
const googleMapsScraper_1 = require("./googleMapsScraper");
function startLeadSearchJob(query, limit) {
    const job = jobStore_1.jobStore.create(query, limit);
    void runLeadSearchJob(job.id);
    return job.id;
}
async function runLeadSearchJob(jobId) {
    const job = jobStore_1.jobStore.get(jobId);
    if (!job) {
        return;
    }
    jobStore_1.jobStore.update(jobId, {
        status: "running",
        progressMessage: "Preparando automacao.",
        progressPercent: 2
    });
    try {
        const leads = await (0, googleMapsScraper_1.scrapeGoogleMaps)(job.query, job.limit, (progress) => {
            jobStore_1.jobStore.update(jobId, {
                progressMessage: progress.message,
                progressPercent: progress.percent ?? jobStore_1.jobStore.get(jobId)?.progressPercent ?? 0
            });
        });
        jobStore_1.jobStore.complete(jobId, leads);
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Nao foi possivel concluir a coleta no momento.";
        jobStore_1.jobStore.fail(jobId, message);
    }
}
