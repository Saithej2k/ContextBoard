import {
  type CreateNoteInput,
  type ReviewSuggestionInput,
  type Task,
  type TaskSuggestion,
  type UpdateTaskInput,
  type WorkspaceSnapshot,
  buildDemoDigest,
  createDemoSnapshot,
  createNoteSchema,
  extractTaskSuggestions,
  reviewSuggestionSchema,
  taskSchema,
  updateTaskSchema,
  workspaceSnapshotSchema
} from "@contextboard/shared";

const workspaceId = "workspace-demo";
const storageKey = "contextboard-demo-state";
const apiBase = import.meta.env.VITE_API_URL as string | undefined;

function cloneSnapshot(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return workspaceSnapshotSchema.parse(JSON.parse(JSON.stringify(snapshot)));
}

function readLocalSnapshot() {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return createDemoSnapshot();
  }
  try {
    return workspaceSnapshotSchema.parse(JSON.parse(stored));
  } catch {
    localStorage.removeItem(storageKey);
    return createDemoSnapshot();
  }
}

function writeLocalSnapshot(snapshot: WorkspaceSnapshot) {
  localStorage.setItem(storageKey, JSON.stringify(snapshot));
  return cloneSnapshot(snapshot);
}

function ownerId(snapshot: WorkspaceSnapshot, ownerName?: string) {
  return snapshot.users.find((user) => user.name.toLowerCase() === ownerName?.toLowerCase())?.id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!apiBase) {
    throw new Error("API URL is not configured");
  }
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function loadWorkspace() {
  if (apiBase) {
    try {
      return await request<WorkspaceSnapshot>(`/workspaces/${workspaceId}`);
    } catch {
      return readLocalSnapshot();
    }
  }
  return readLocalSnapshot();
}

export async function createNote(input: CreateNoteInput) {
  const payload = createNoteSchema.parse(input);
  if (apiBase) {
    return request<WorkspaceSnapshot>(`/workspaces/${workspaceId}/notes`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  const snapshot = readLocalSnapshot();
  const author = snapshot.users.find((user) => user.id === payload.authorId) ?? snapshot.users[0];
  const note = {
    id: `note-${crypto.randomUUID()}`,
    workspaceId,
    authorId: author.id,
    authorName: author.name,
    title: payload.title,
    body: payload.body,
    tags: payload.tags,
    createdAt: new Date().toISOString()
  };
  const suggestions = extractTaskSuggestions(note, snapshot.users);

  return writeLocalSnapshot({
    ...snapshot,
    notes: [note, ...snapshot.notes],
    suggestions: [...suggestions, ...snapshot.suggestions]
  });
}

export async function reviewSuggestion(suggestion: TaskSuggestion, input: ReviewSuggestionInput) {
  const payload = reviewSuggestionSchema.parse(input);
  if (apiBase) {
    return request<WorkspaceSnapshot>(`/workspaces/${workspaceId}/suggestions/${suggestion.id}/review`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  }

  const snapshot = readLocalSnapshot();
  const status = payload.decision === "accept" ? ("accepted" as const) : ("dismissed" as const);
  const suggestions = snapshot.suggestions.map((candidate) =>
    candidate.id === suggestion.id ? { ...candidate, status } : candidate
  );
  const tasks =
    payload.decision === "accept"
      ? [
          taskSchema.parse({
            id: `task-${crypto.randomUUID()}`,
            workspaceId,
            suggestionId: suggestion.id,
            noteId: suggestion.noteId,
            title: payload.title ?? suggestion.title,
            ownerId: ownerId(snapshot, payload.ownerName ?? suggestion.ownerName),
            ownerName: payload.ownerName ?? suggestion.ownerName,
            dueLabel: payload.dueLabel ?? suggestion.dueLabel,
            priority: payload.priority ?? suggestion.priority,
            status: "todo",
            sourceExcerpt: suggestion.sourceExcerpt,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }),
          ...snapshot.tasks
        ]
      : snapshot.tasks;

  return writeLocalSnapshot({
    ...snapshot,
    suggestions,
    tasks,
    digest: buildDemoDigest(tasks)
  });
}

export async function updateTask(task: Task, input: UpdateTaskInput) {
  const payload = updateTaskSchema.parse(input);
  if (apiBase) {
    return request<WorkspaceSnapshot>(`/workspaces/${workspaceId}/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }

  const snapshot = readLocalSnapshot();
  const tasks = snapshot.tasks.map((candidate) =>
    candidate.id === task.id
      ? {
          ...candidate,
          ...payload,
          ownerId: ownerId(snapshot, payload.ownerName) ?? candidate.ownerId,
          updatedAt: new Date().toISOString()
        }
      : candidate
  );

  return writeLocalSnapshot({
    ...snapshot,
    tasks,
    digest: buildDemoDigest(tasks)
  });
}

export function resetWorkspace() {
  return writeLocalSnapshot(createDemoSnapshot());
}

