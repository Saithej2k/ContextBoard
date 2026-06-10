import { Pool } from "pg";
import { MemoryRepository, PostgresRepository } from "./repository.js";

export function createRepository() {
  if (!process.env.DATABASE_URL) {
    return new MemoryRepository();
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });

  return new PostgresRepository(pool);
}
