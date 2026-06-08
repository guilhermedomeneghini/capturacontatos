import express from "express";
import path from "path";
import { leadsRouter } from "./routes/leads.routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const publicDir = path.join(process.cwd(), "src", "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/vendor/lucide",
  express.static(path.join(process.cwd(), "node_modules", "lucide", "dist", "umd"))
);
app.use(express.static(publicDir));

app.use("/api/leads", leadsRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Rota nao encontrada." });
});

app.listen(port, () => {
  console.log(`Sistema local disponivel em http://localhost:${port}`);
});
