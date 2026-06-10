import "dotenv/config";
import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 4100);

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "contextboard-api" });
});

app.listen(port, () => {
  console.log(`ContextBoard API listening on ${port}`);
});

