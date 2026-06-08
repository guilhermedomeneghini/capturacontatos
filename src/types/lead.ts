export interface Lead {
  nome: string;
  endereco: string;
  site: string;
  telefone: string;
}

export interface LeadProgress {
  message: string;
  percent?: number;
}

export type LeadJobStatus = "queued" | "running" | "completed" | "failed";

export interface LeadJob {
  id: string;
  query: string;
  limit: number;
  status: LeadJobStatus;
  progressMessage: string;
  progressPercent: number;
  leads: Lead[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}
