import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createRepository, databaseConnectionString } from "./db.js";
import { contextBoardRoutes } from "./routes.js";

const app = express();
const port = Number(process.env.PORT ?? 4100);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "contextboard-api",
    storage: databaseConnectionString() ? "postgres" : "memory"
  });
});

app.use("/api", contextBoardRoutes(await createRepository()));

app.listen(port, () => {
  console.log(`ContextBoard API listening on ${port}`);
});
