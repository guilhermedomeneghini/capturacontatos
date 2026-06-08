import { Router } from "express";
import {
  exportCsv,
  exportJson,
  getJob,
  startSearch
} from "../controllers/leadsController";

export const leadsRouter = Router();

leadsRouter.post("/search", startSearch);
leadsRouter.get("/jobs/:id", getJob);
leadsRouter.get("/jobs/:id/export/csv", exportCsv);
leadsRouter.get("/jobs/:id/export/json", exportJson);
