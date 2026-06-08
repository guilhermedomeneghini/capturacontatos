"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const leads_routes_1 = require("./routes/leads.routes");
const app = (0, express_1.default)();
const port = Number(process.env.PORT ?? 3000);
// In production (dist), public files are at ./public
// In development (src), they're at ../public
const publicDir = path_1.default.join(__dirname, "public");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/vendor/lucide", express_1.default.static(path_1.default.join(process.cwd(), "node_modules", "lucide", "dist", "umd")));
app.use(express_1.default.static(publicDir));
app.use("/api/leads", leads_routes_1.leadsRouter);
app.get("/health", (_req, res) => {
    res.json({ ok: true });
});
app.use((_req, res) => {
    res.status(404).json({ message: "Rota nao encontrada." });
});
app.listen(port, () => {
    console.log(`Sistema local disponivel em http://localhost:${port}`);
});
