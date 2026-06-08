import { randomUUID } from "crypto";
import { Lead, LeadJob } from "../types/lead";

class JobStore {
  private readonly jobs = new Map<string, LeadJob>();

  create(query: string, limit: number): LeadJob {
    const now = new Date().toISOString();
    const job: LeadJob = {
      id: randomUUID(),
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

  get(id: string): LeadJob | undefined {
    return this.jobs.get(id);
  }

  update(
    id: string,
    patch: Partial<Omit<LeadJob, "id" | "createdAt">>
  ): LeadJob | undefined {
    const current = this.jobs.get(id);
    if (!current) {
      return undefined;
    }

    const updated: LeadJob = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    this.jobs.set(id, updated);
    return updated;
  }

  complete(id: string, leads: Lead[]): LeadJob | undefined {
    return this.update(id, {
      status: "completed",
      progressMessage: `Coleta concluida com ${leads.length} lead(s).`,
      progressPercent: 100,
      leads
    });
  }

  fail(id: string, error: string): LeadJob | undefined {
    return this.update(id, {
      status: "failed",
      progressMessage: "Nao foi possivel concluir a coleta.",
      progressPercent: 100,
      error
    });
  }
}

export const jobStore = new JobStore();
