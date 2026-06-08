"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsToCsv = leadsToCsv;
exports.leadsToJson = leadsToJson;
const headers = ["nome", "endereco", "site", "telefone"];
function escapeCsv(value) {
    const normalized = value ?? "";
    if (/[",\n\r;]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
}
function leadsToCsv(leads) {
    const titleRow = ["Nome", "Endereco", "Site", "Telefone"].join(";");
    const rows = leads.map((lead) => headers.map((header) => escapeCsv(lead[header])).join(";"));
    return [titleRow, ...rows].join("\n");
}
function leadsToJson(leads) {
    return JSON.stringify(leads, null, 2);
}
