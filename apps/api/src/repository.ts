import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import {
  type CreateNoteInput,
  type Note,
  type ReviewSuggestionInput,
  type Task,
  type TaskSuggestion,
  type UpdateTaskInput,
  type User,
  type WorkspaceSnapshot,
  buildDemoDigest,
  createDemoSnapshot,
  extractTaskSuggestions,
  pilotMetrics,
  taskSchema,
  taskSuggestionSchema,
  workspaceSnapshotSchema
} from "@contextboard/shared";
import { buildWeeklyDigest } from "./digest.js";

export interface ContextBoardRepository {
  getSnapshot(workspaceId: string): Promise<WorkspaceSnapshot>;
  createNote(workspaceId: string, input: CreateNoteInput): Promise<WorkspaceSnapshot>;
  reviewSuggestion(workspaceId: string, suggestionId: string, input: ReviewSuggestionInput): Promise<WorkspaceSnapshot>;
  updateTask(workspaceId: string, taskId: string, input: UpdateTaskInput): Promise<WorkspaceSnapshot>;
}

function userById(users: User[], id: string) {
  const user = users.find((candidate) => candidate.id === id);
  if (!user) {
    throw new Error(`Unknown user: ${id}`);
  }
  return user;
}

function resolveOwnerId(users: User[], ownerName?: string) {
  if (!ownerName) {
    return undefined;
  }
  return users.find((user) => user.name.toLowerCase() === ownerName.toLowerCase())?.id;
}

export class MemoryRepository implements ContextBoardRepository {
  private snapshot = createDemoSnapshot();

  async getSnapshot(workspaceId: string) {
    if (workspaceId !== this.snapshot.workspaceId) {
      return this.snapshot;
    }
    return workspaceSnapshotSchema.parse(this.snapshot);
  }

  async createNote(workspaceId: string, input: CreateNoteInput) {
    const author = userById(this.snapshot.users, input.authorId);
    const note: Note = {
      id: `note-${randomUUID()}`,
      workspaceId,
      authorId: author.id,
      authorName: author.name,
      title: input.title,
      body: input.body,
      tags: input.tags,
      createdAt: new Date().toISOString()
    };
    const suggestions = extractTaskSuggestions(note, this.snapshot.users);
    this.snapshot = {
      ...this.snapshot,
      notes: [note, ...this.snapshot.notes],
      suggestions: [...suggestions, ...this.snapshot.suggestions]
    };
    return this.getSnapshot(workspaceId);
  }

  async reviewSuggestion(workspaceId: string, suggestionId: string, input: ReviewSuggestionInput) {
    const suggestion = this.snapshot.suggestions.find((candidate) => candidate.id === suggestionId);
    if (!suggestion) {
      throw new Error("Suggestion not found");
    }

    const status = input.decision === "accept" ? ("accepted" as const) : ("dismissed" as const);
    const suggestions = this.snapshot.suggestions.map((candidate) =>
      candidate.id === suggestionId ? { ...candidate, status } : candidate
    );
    const tasks =
      input.decision === "accept"
        ? [
            taskSchema.parse({
              id: `task-${randomUUID()}`,
              workspaceId,
              suggestionId,
              noteId: suggestion.noteId,
              title: input.title ?? suggestion.title,
              ownerId: resolveOwnerId(this.snapshot.users, input.ownerName ?? suggestion.ownerName),
              ownerName: input.ownerName ?? suggestion.ownerName,
              dueLabel: input.dueLabel ?? suggestion.dueLabel,
              priority: input.priority ?? suggestion.priority,
              status: "todo",
              sourceExcerpt: suggestion.sourceExcerpt,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }),
            ...this.snapshot.tasks
          ]
        : this.snapshot.tasks;

    this.snapshot = {
      ...this.snapshot,
      suggestions,
      tasks,
      digest: buildDemoDigest(tasks)
    };
    return this.getSnapshot(workspaceId);
  }

  async updateTask(workspaceId: string, taskId: string, input: UpdateTaskInput) {
    this.snapshot = {
      ...this.snapshot,
      tasks: this.snapshot.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...input,
              ownerId: resolveOwnerId(this.snapshot.users, input.ownerName) ?? task.ownerId,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    };
    this.snapshot.digest = buildDemoDigest(this.snapshot.tasks);
    return this.getSnapshot(workspaceId);
  }
}

function iso(value: unknown) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function mapNote(row: any, users: User[]): Note {
  const author = userById(users, row.author_id);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    authorId: row.author_id,
    authorName: author.name,
    title: row.title,
    body: row.body,
    tags: row.tags ?? [],
    createdAt: iso(row.created_at)
  };
}

function mapSuggestion(row: any): TaskSuggestion {
  return taskSuggestionSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    noteId: row.note_id,
    title: row.title,
    ownerName: row.owner_name ?? undefined,
    dueLabel: row.due_label ?? undefined,
    priority: row.priority,
    confidence: Number(row.confidence),
    sourceExcerpt: row.source_excerpt,
    rationale: row.rationale,
    status: row.status,
    createdAt: iso(row.created_at)
  });
}

function mapTask(row: any): Task {
  return taskSchema.parse({
    id: row.id,
    workspaceId: row.workspace_id,
    suggestionId: row.suggestion_id ?? undefined,
    noteId: row.note_id ?? undefined,
    title: row.title,
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name ?? undefined,
    dueLabel: row.due_label ?? undefined,
    priority: row.priority,
    status: row.status,
    sourceExcerpt: row.source_excerpt ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}

async function insertSuggestion(client: Pool | PoolClient, suggestion: TaskSuggestion) {
  await client.query(
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

export class PostgresRepository implements ContextBoardRepository {
  constructor(private readonly pool: Pool) {}

  async getSnapshot(workspaceId: string) {
    const [workspaceResult, usersResult, notesResult, suggestionsResult, tasksResult] = await Promise.all([
      this.pool.query("select id, name from workspaces where id = $1", [workspaceId]),
      this.pool.query("select * from workspace_users where workspace_id = $1 order by name", [workspaceId]),
      this.pool.query("select * from notes where workspace_id = $1 order by created_at desc", [workspaceId]),
      this.pool.query("select * from task_suggestions where workspace_id = $1 order by created_at desc", [workspaceId]),
      this.pool.query("select * from tasks where workspace_id = $1 order by updated_at desc", [workspaceId])
    ]);

    const users: User[] = usersResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      avatarHue: row.avatar_hue
    }));
    const tasks = tasksResult.rows.map(mapTask);

    return workspaceSnapshotSchema.parse({
      workspaceId,
      workspaceName: workspaceResult.rows[0]?.name ?? "ContextBoard",
      users,
      notes: notesResult.rows.map((row) => mapNote(row, users)),
      suggestions: suggestionsResult.rows.map(mapSuggestion),
      tasks,
      digest: buildWeeklyDigest(workspaceId, tasks),
      metrics: pilotMetrics
    });
  }

  async createNote(workspaceId: string, input: CreateNoteInput) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const users = await client.query("select * from workspace_users where workspace_id = $1", [workspaceId]);
      const workspaceUsers: User[] = users.rows.map((row) => ({
        id: row.id,
        name: row.name,
        role: row.role,
        avatarHue: row.avatar_hue
      }));
      const author = userById(workspaceUsers, input.authorId);
      const note: Note = {
        id: `note-${randomUUID()}`,
        workspaceId,
        authorId: author.id,
        authorName: author.name,
        title: input.title,
        body: input.body,
        tags: input.tags,
        createdAt: new Date().toISOString()
      };

      await client.query(
        "insert into notes (id, workspace_id, author_id, title, body, tags, created_at) values ($1, $2, $3, $4, $5, $6, $7)",
        [note.id, note.workspaceId, note.authorId, note.title, note.body, note.tags, note.createdAt]
      );

      for (const suggestion of extractTaskSuggestions(note, workspaceUsers)) {
        await insertSuggestion(client, suggestion);
      }

      await client.query("commit");
      return this.getSnapshot(workspaceId);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async reviewSuggestion(workspaceId: string, suggestionId: string, input: ReviewSuggestionInput) {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const suggestionResult = await client.query("select * from task_suggestions where id = $1 and workspace_id = $2", [
        suggestionId,
        workspaceId
      ]);
      if (!suggestionResult.rows[0]) {
        throw new Error("Suggestion not found");
      }
      const suggestion = mapSuggestion(suggestionResult.rows[0]);
      const status = input.decision === "accept" ? "accepted" : "dismissed";
      await client.query("update task_suggestions set status = $1 where id = $2", [status, suggestionId]);

      if (input.decision === "accept") {
        const ownerName = input.ownerName ?? suggestion.ownerName;
        const ownerResult = ownerName
          ? await client.query("select id from workspace_users where lower(name) = lower($1) and workspace_id = $2", [
              ownerName,
              workspaceId
            ])
          : undefined;
        await client.query(
          `insert into tasks
            (id, workspace_id, suggestion_id, note_id, title, owner_id, owner_name, due_label, priority, status, source_excerpt)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'todo', $10)`,
          [
            `task-${randomUUID()}`,
            workspaceId,
            suggestionId,
            suggestion.noteId,
            input.title ?? suggestion.title,
            ownerResult?.rows[0]?.id ?? null,
            ownerName ?? null,
            input.dueLabel ?? suggestion.dueLabel ?? null,
            input.priority ?? suggestion.priority,
            suggestion.sourceExcerpt
          ]
        );
      }

      await client.query("commit");
      return this.getSnapshot(workspaceId);
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateTask(workspaceId: string, taskId: string, input: UpdateTaskInput) {
    const current = await this.pool.query("select * from tasks where id = $1 and workspace_id = $2", [taskId, workspaceId]);
    if (!current.rows[0]) {
      throw new Error("Task not found");
    }
    const task = mapTask(current.rows[0]);
    const ownerName = input.ownerName ?? task.ownerName;
    const ownerResult = ownerName
      ? await this.pool.query("select id from workspace_users where lower(name) = lower($1) and workspace_id = $2", [
          ownerName,
          workspaceId
        ])
      : undefined;

    await this.pool.query(
      `update tasks
       set title = $1, owner_id = $2, owner_name = $3, due_label = $4, priority = $5, status = $6, updated_at = now()
       where id = $7 and workspace_id = $8`,
      [
        input.title ?? task.title,
        ownerResult?.rows[0]?.id ?? task.ownerId ?? null,
        ownerName ?? null,
        input.dueLabel ?? task.dueLabel ?? null,
        input.priority ?? task.priority,
        input.status ?? task.status,
        taskId,
        workspaceId
      ]
    );
    return this.getSnapshot(workspaceId);
  }
}
