import { Lead } from "../types/lead";
import * as XLSX from "xlsx";

const headers: Array<keyof Lead> = ["nome", "endereco", "site", "telefone"];
const columnNames = ["Nome", "Endereço", "Site", "Telefone"];

function escapeCsv(value: string): string {
  const normalized = (value ?? "").trim();
  
  // Se contiver ponto e vírgula, vírgula, aspas ou quebra de linha, envolve em aspas
  if (/[;";\n\r]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  
  return normalized;
}

export function leadsToCsv(leads: Lead[]): string {
  // Usar ponto e vírgula como separador (funciona melhor com Excel em PT-BR)
  const titleRow = columnNames.join(";");
  const rows = leads.map((lead) =>
    headers.map((header) => escapeCsv(lead[header])).join(";")
  );

  return [titleRow, ...rows].join("\n");
}

export function leadsToExcel(leads: Lead[]): Buffer {
  // Criar array de dados com cabeçalho
  const data = [
    columnNames,
    ...leads.map((lead) => [lead.nome, lead.endereco, lead.site, lead.telefone])
  ];

  // Criar workbook
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Ajustar largura das colunas
  worksheet["!cols"] = [
    { wch: 30 }, // Nome
    { wch: 40 }, // Endereço
    { wch: 35 }, // Site
    { wch: 20 }  // Telefone
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  // Gerar buffer
  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
}

export function leadsToJson(leads: Lead[]): string {
  return JSON.stringify(leads, null, 2);
}
