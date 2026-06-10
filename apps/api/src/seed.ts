import "dotenv/config";
import { createPool, runMigrations, seedDemoWorkspace } from "./db.js";

const pool = createPool();

if (!pool) {
  throw new Error("DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD/DB_NAME is required to seed PostgreSQL");
}

await runMigrations(pool);
await seedDemoWorkspace(pool, true);
await pool.end();

console.log("Seeded ContextBoard demo workspace");

