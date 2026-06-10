import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool } from "pg";
import { demoNotes, demoSuggestions, demoTasks, demoUsers } from "@contextboard/shared";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed PostgreSQL");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dirname = path.dirname(fileURLToPath(import.meta.url));
const migration = await readFile(path.join(dirname, "../db/001_initial.sql"), "utf8");

await pool.query(migration);
await pool.query("delete from tasks");
await pool.query("delete from task_suggestions");
await pool.query("delete from notes");
await pool.query("delete from workspace_users");
await pool.query("delete from workspaces");
await pool.query("insert into workspaces (id, name) values ($1, $2)", ["workspace-demo", "ContextBoard Pilot"]);

for (const user of demoUsers) {
  await pool.query(
    "insert into workspace_users (id, workspace_id, name, role, avatar_hue) values ($1, $2, $3, $4, $5)",
    [user.id, "workspace-demo", user.name, user.role, user.avatarHue]
  );
}

for (const note of demoNotes) {
  await pool.query(
    "insert into notes (id, workspace_id, author_id, title, body, tags, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
    [note.id, note.workspaceId, note.authorId, note.title, note.body, note.tags, note.createdAt]
  );
}

for (const suggestion of demoSuggestions) {
  await pool.query(
    `insert into task_suggestions
      (id, workspace_id, note_id, title, owner_name, due_label, priority, confidence, source_excerpt, rationale, status, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
  await pool.query(
    `insert into tasks
      (id, workspace_id, suggestion_id, note_id, title, owner_id, owner_name, due_label, priority, status, source_excerpt, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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

await pool.end();
console.log("Seeded ContextBoard demo workspace");

