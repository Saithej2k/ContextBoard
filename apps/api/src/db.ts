import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { demoNotes, demoSuggestions, demoTasks, demoUsers } from "@contextboard/shared";
import { MemoryRepository, PostgresRepository } from "./repository.js";

function migrationPath() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.join(dirname, "../db/001_initial.sql");
}

export function databaseConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const name = process.env.DB_NAME;

  if (!host || !user || !password || !name) {
    return undefined;
  }

  const port = process.env.DB_PORT ?? "5432";
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
}

export function createPool() {
  const connectionString = databaseConnectionString();
  if (!connectionString) {
    return undefined;
  }

  return new Pool({
    connectionString,
    max: 8,
    ssl: process.env.DATABASE_SSL === "true" || process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });
}

export async function runMigrations(pool: Pool) {
  const migration = await readFile(migrationPath(), "utf8");
  await pool.query(migration);
}

export async function seedDemoWorkspace(pool: Pool, reset = false) {
  const existing = await pool.query("select id from workspaces limit 1");
  if (existing.rowCount && !reset) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    if (reset) {
      await client.query("delete from tasks");
      await client.query("delete from task_suggestions");
      await client.query("delete from notes");
      await client.query("delete from workspace_users");
      await client.query("delete from workspaces");
    }

    await client.query("insert into workspaces (id, name) values ($1, $2) on conflict (id) do nothing", [
      "workspace-demo",
      "ContextBoard Pilot"
    ]);

    for (const user of demoUsers) {
      await client.query(
        `insert into workspace_users (id, workspace_id, name, role, avatar_hue)
         values ($1, $2, $3, $4, $5)
         on conflict (id) do nothing`,
        [user.id, "workspace-demo", user.name, user.role, user.avatarHue]
      );
    }

    for (const note of demoNotes) {
      await client.query(
        `insert into notes (id, workspace_id, author_id, title, body, tags, created_at)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (id) do nothing`,
        [note.id, note.workspaceId, note.authorId, note.title, note.body, note.tags, note.createdAt]
      );
    }

    for (const suggestion of demoSuggestions) {
      await client.query(
        `insert into task_suggestions
          (id, workspace_id, note_id, title, owner_name, due_label, priority, confidence, source_excerpt, rationale, status, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         on conflict (id) do nothing`,
        [
          suggestion.id,
          suggestion.workspaceId,
          suggestion.noteId,
          suggestion.title,
          suggestion.ownerName ?? null,
          suggestion.dueLabel ?? null,
          suggestion.priority,
          suggestion.confidence,
          suggestion.sourceExcerpt,
          suggestion.rationale,
          suggestion.status,
          suggestion.createdAt
        ]
      );
    }

    for (const task of demoTasks) {
      await client.query(
        `insert into tasks
          (id, workspace_id, suggestion_id, note_id, title, owner_id, owner_name, due_label, priority, status, source_excerpt, created_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         on conflict (id) do nothing`,
        [
          task.id,
          task.workspaceId,
          task.suggestionId ?? null,
          task.noteId ?? null,
          task.title,
          task.ownerId ?? null,
          task.ownerName ?? null,
          task.dueLabel ?? null,
          task.priority,
          task.status,
          task.sourceExcerpt ?? null,
          task.createdAt,
          task.updatedAt
        ]
      );
    }

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function createRepository() {
  const pool = createPool();
  if (!pool) {
    return new MemoryRepository();
  }

  await runMigrations(pool);
  await seedDemoWorkspace(pool);
  return new PostgresRepository(pool);
}

