import { jobStore } from "./jobStore";
import { scrapeGoogleMaps } from "./googleMapsScraper";

export function startLeadSearchJob(query: string, limit: number): string {
  const job = jobStore.create(query, limit);

  void runLeadSearchJob(job.id);

  return job.id;
}

async function runLeadSearchJob(jobId: string): Promise<void> {
  const job = jobStore.get(jobId);
  if (!job) {
    return;
  }

  jobStore.update(jobId, {
    status: "running",
    progressMessage: "Preparando automacao.",
    progressPercent: 2
  });

  try {
    const leads = await scrapeGoogleMaps(job.query, job.limit, (progress) => {
      jobStore.update(jobId, {
        progressMessage: progress.message,
        progressPercent: progress.percent ?? jobStore.get(jobId)?.progressPercent ?? 0
      });
    });

    jobStore.complete(jobId, leads);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel concluir a coleta no momento.";

    jobStore.fail(jobId, message);
  }
}
