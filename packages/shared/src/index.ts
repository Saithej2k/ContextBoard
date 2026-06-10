import { z } from "zod";

export const pilotMetrics = {
  betaUsers: 11,
  notesCaptured: 1427,
  acceptedTasks: 320,
  pilotWeeks: 8
} as const;

export const taskStatuses = ["todo", "in_progress", "waiting", "done"] as const;
export const suggestionStatuses = ["pending", "accepted", "dismissed"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  avatarHue: z.number().int().min(0).max(360)
});

export const noteSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()),
  createdAt: z.string()
});

export const taskSuggestionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  noteId: z.string(),
  title: z.string().min(1),
  ownerName: z.string().optional(),
  dueLabel: z.string().optional(),
  priority: z.enum(taskPriorities),
  confidence: z.number().min(0).max(1),
  sourceExcerpt: z.string().min(1),
  rationale: z.string().min(1),
  status: z.enum(suggestionStatuses),
  createdAt: z.string()
});

export const taskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  suggestionId: z.string().optional(),
  noteId: z.string().optional(),
  title: z.string().min(1),
  ownerId: z.string().optional(),
  ownerName: z.string().optional(),
  dueLabel: z.string().optional(),
  priority: z.enum(taskPriorities),
  status: z.enum(taskStatuses),
  sourceExcerpt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const digestItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  detail: z.string(),
  ownerName: z.string().optional(),
  status: z.enum(taskStatuses).optional()
});

export const weeklyDigestSchema = z.object({
  workspaceId: z.string(),
  generatedAt: z.string(),
  summary: z.string(),
  wins: z.array(digestItemSchema),
  risks: z.array(digestItemSchema),
  followUps: z.array(digestItemSchema)
});

export const workspaceSnapshotSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  users: z.array(userSchema),
  notes: z.array(noteSchema),
  suggestions: z.array(taskSuggestionSchema),
  tasks: z.array(taskSchema),
  digest: weeklyDigestSchema,
  metrics: z.object({
    betaUsers: z.number(),
    notesCaptured: z.number(),
    acceptedTasks: z.number(),
    pilotWeeks: z.number()
  })
});

export const createNoteSchema = z.object({
  title: z.string().min(1).max(140),
  body: z.string().min(1).max(6000),
  authorId: z.string(),
  tags: z.array(z.string()).default([])
});

export const reviewSuggestionSchema = z.object({
  decision: z.enum(["accept", "dismiss"]),
  title: z.string().min(1).max(180).optional(),
  ownerName: z.string().max(80).optional(),
  dueLabel: z.string().max(80).optional(),
  priority: z.enum(taskPriorities).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(180).optional(),
  ownerName: z.string().max(80).optional(),
  dueLabel: z.string().max(80).optional(),
  priority: z.enum(taskPriorities).optional(),
  status: z.enum(taskStatuses).optional()
});

export type User = z.infer<typeof userSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Task = z.infer<typeof taskSchema>;
export type TaskSuggestion = z.infer<typeof taskSuggestionSchema>;
export type WeeklyDigest = z.infer<typeof weeklyDigestSchema>;
export type WorkspaceSnapshot = z.infer<typeof workspaceSnapshotSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type ReviewSuggestionInput = z.infer<typeof reviewSuggestionSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskStatus = z.infer<typeof taskSchema>["status"];
export type SuggestionStatus = z.infer<typeof taskSuggestionSchema>["status"];
export type TaskPriority = z.infer<typeof taskSchema>["priority"];

const now = "2026-06-03T14:00:00.000Z";

export const demoUsers: User[] = [
  { id: "usr-sai", name: "Sai Patel", role: "Product", avatarHue: 166 },
  { id: "usr-maya", name: "Maya Chen", role: "Design", avatarHue: 24 },
  { id: "usr-jules", name: "Jules Avery", role: "Engineering", avatarHue: 222 },
  { id: "usr-nora", name: "Nora Diaz", role: "Operations", avatarHue: 306 }
];

export const demoNotes: Note[] = [
  {
    id: "note-kickoff",
    workspaceId: "workspace-demo",
    authorId: "usr-sai",
    authorName: "Sai Patel",
    title: "Pilot onboarding review",
    body:
      "Maya to tighten the empty-state copy before Friday. Jules will add owner filters to the task board by next week. Follow up with Nora about workspace invite limits.",
    tags: ["pilot", "onboarding"],
    createdAt: "2026-05-27T15:20:00.000Z"
  },
  {
    id: "note-digest",
    workspaceId: "workspace-demo",
    authorId: "usr-nora",
    authorName: "Nora Diaz",
    title: "Weekly digest retro",
    body:
      "Action: Sai should publish the digest summary for the beta group. TODO Jules: capture latency numbers before the architecture note goes out. Maya to review the task acceptance flow tomorrow.",
    tags: ["digest", "retro"],
    createdAt: "2026-05-30T18:05:00.000Z"
  },
  {
    id: "note-support",
    workspaceId: "workspace-demo",
    authorId: "usr-maya",
    authorName: "Maya Chen",
    title: "Support desk notes",
    body:
      "Users liked seeing the source note next to accepted tasks. Nora to group dismissed suggestions by reason. We should add a waiting state for blocked follow-ups.",
    tags: ["support"],
    createdAt: "2026-06-02T12:15:00.000Z"
  }
];

export const demoSuggestions: TaskSuggestion[] = [
  {
    id: "sug-empty-copy",
    workspaceId: "workspace-demo",
    noteId: "note-kickoff",
    title: "Tighten the empty-state copy",
    ownerName: "Maya Chen",
    dueLabel: "Friday",
    priority: "medium",
    confidence: 0.86,
    sourceExcerpt: "Maya to tighten the empty-state copy before Friday.",
    rationale: "Matched owner-first action phrase with an explicit due label.",
    status: "accepted",
    createdAt: "2026-05-27T15:20:30.000Z"
  },
  {
    id: "sug-owner-filter",
    workspaceId: "workspace-demo",
    noteId: "note-kickoff",
    title: "Add owner filters to the task board",
    ownerName: "Jules Avery",
    dueLabel: "next week",
    priority: "high",
    confidence: 0.82,
    sourceExcerpt: "Jules will add owner filters to the task board by next week.",
    rationale: "Matched commitment verb and date phrase.",
    status: "pending",
    createdAt: "2026-05-27T15:20:31.000Z"
  },
  {
    id: "sug-digest-summary",
    workspaceId: "workspace-demo",
    noteId: "note-digest",
    title: "Publish the digest summary for the beta group",
    ownerName: "Sai Patel",
    priority: "medium",
    confidence: 0.79,
    sourceExcerpt: "Action: Sai should publish the digest summary for the beta group.",
    rationale: "Matched action label and should-statement.",
    status: "accepted",
    createdAt: "2026-05-30T18:05:30.000Z"
  },
  {
    id: "sug-dismissed",
    workspaceId: "workspace-demo",
    noteId: "note-support",
    title: "Add a waiting state for blocked follow-ups",
    priority: "low",
    confidence: 0.61,
    sourceExcerpt: "We should add a waiting state for blocked follow-ups.",
    rationale: "Matched should-statement without clear owner.",
    status: "dismissed",
    createdAt: "2026-06-02T12:15:30.000Z"
  }
];

export const demoTasks: Task[] = [
  {
    id: "task-empty-copy",
    workspaceId: "workspace-demo",
    suggestionId: "sug-empty-copy",
    noteId: "note-kickoff",
    title: "Tighten the empty-state copy",
    ownerId: "usr-maya",
    ownerName: "Maya Chen",
    dueLabel: "Friday",
    priority: "medium",
    status: "done",
    sourceExcerpt: "Maya to tighten the empty-state copy before Friday.",
    createdAt: "2026-05-27T16:00:00.000Z",
    updatedAt: "2026-05-31T11:25:00.000Z"
  },
  {
    id: "task-digest-summary",
    workspaceId: "workspace-demo",
    suggestionId: "sug-digest-summary",
    noteId: "note-digest",
    title: "Publish the digest summary for the beta group",
    ownerId: "usr-sai",
    ownerName: "Sai Patel",
    priority: "medium",
    status: "in_progress",
    sourceExcerpt: "Action: Sai should publish the digest summary for the beta group.",
    createdAt: "2026-05-30T19:00:00.000Z",
    updatedAt: "2026-06-03T10:15:00.000Z"
  },
  {
    id: "task-latency",
    workspaceId: "workspace-demo",
    noteId: "note-digest",
    title: "Capture latency numbers before publishing architecture note",
    ownerId: "usr-jules",
    ownerName: "Jules Avery",
    dueLabel: "before architecture note",
    priority: "high",
    status: "waiting",
    sourceExcerpt: "TODO Jules: capture latency numbers before the architecture note goes out.",
    createdAt: "2026-05-30T19:04:00.000Z",
    updatedAt: "2026-06-02T16:10:00.000Z"
  }
];

export function buildDemoDigest(tasks: Task[], generatedAt = now): WeeklyDigest {
  const done = tasks.filter((task) => task.status === "done");
  const blocked = tasks.filter((task) => task.status === "waiting");
  const active = tasks.filter((task) => task.status !== "done");

  return {
    workspaceId: "workspace-demo",
    generatedAt,
    summary: `${done.length} task completed, ${active.length} follow-ups still active, ${blocked.length} waiting on outside input.`,
    wins: done.map((task) => ({
      id: `win-${task.id}`,
      label: task.title,
      detail: task.sourceExcerpt ?? "Completed from reviewed task.",
      ownerName: task.ownerName,
      status: task.status
    })),
    risks: blocked.map((task) => ({
      id: `risk-${task.id}`,
      label: task.title,
      detail: task.dueLabel ?? "Needs a reviewer decision.",
      ownerName: task.ownerName,
      status: task.status
    })),
    followUps: active.map((task) => ({
      id: `follow-${task.id}`,
      label: task.title,
      detail: task.sourceExcerpt ?? "Open follow-up.",
      ownerName: task.ownerName,
      status: task.status
    }))
  };
}

export function createDemoSnapshot(): WorkspaceSnapshot {
  return workspaceSnapshotSchema.parse({
    workspaceId: "workspace-demo",
    workspaceName: "ContextBoard Pilot",
    users: demoUsers,
    notes: demoNotes,
    suggestions: demoSuggestions,
    tasks: demoTasks,
    digest: buildDemoDigest(demoTasks),
    metrics: pilotMetrics
  });
}

const actionMarkers = [
  /^(?:action|todo|follow up|next):\s*/i,
  /^\-\s*\[\s*\]\s*/i,
  /^next step:\s*/i
];

const ownerActionPattern =
  /^(?<owner>[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(?:to|will|should|needs to|can)\s+(?<action>.+)$/i;
const duePattern =
  /\b(?:by|before|on|due)\s+(?<due>today|tomorrow|friday|monday|next week|end of week|[A-Z][a-z]+\s\d{1,2}|\d{4}-\d{2}-\d{2})\b/i;

function sentenceCandidates(body: string) {
  return body
    .split(/\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeActionTitle(action: string) {
  return action
    .replace(duePattern, "")
    .replace(/\s+/g, " ")
    .replace(/[.!]$/, "")
    .trim()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function findUserName(fragment: string, users: User[]) {
  const lower = fragment.toLowerCase();
  return users.find((user) => {
    const [firstName] = user.name.toLowerCase().split(" ");
    return lower.includes(user.name.toLowerCase()) || lower === firstName;
  })?.name;
}

export function extractTaskSuggestions(note: Note, users: User[]): TaskSuggestion[] {
  const suggestions = sentenceCandidates(note.body).flatMap((candidate, index) => {
    const stripped = actionMarkers.reduce((text, marker) => text.replace(marker, ""), candidate);
    const match = stripped.match(ownerActionPattern);
    const dueMatch = stripped.match(duePattern);
    const hasActionMarker = stripped !== candidate;
    const hasIntent = /\b(to|will|should|needs to|todo|action|follow up)\b/i.test(candidate);

    if (!match?.groups && !hasActionMarker && !hasIntent) {
      return [];
    }

    const ownerName = match?.groups?.owner
      ? findUserName(match.groups.owner, users) ?? match.groups.owner
      : findUserName(stripped, users);
    const rawAction = match?.groups?.action ?? stripped.replace(/^[A-Z][a-z]+:\s*/, "");
    const title = normalizeActionTitle(rawAction);

    if (!title || title.length < 6) {
      return [];
    }

    const confidence = Math.min(
      0.95,
      0.54 + (ownerName ? 0.16 : 0) + (dueMatch?.groups?.due ? 0.12 : 0) + (hasActionMarker ? 0.1 : 0)
    );

    return [
      taskSuggestionSchema.parse({
        id: `${note.id}-suggestion-${index + 1}`,
        workspaceId: note.workspaceId,
        noteId: note.id,
        title,
        ownerName,
        dueLabel: dueMatch?.groups?.due,
        priority: confidence > 0.8 ? "high" : "medium",
        confidence: Number(confidence.toFixed(2)),
        sourceExcerpt: candidate,
        rationale: ownerName
          ? "Matched a named owner and action-oriented wording."
          : "Matched action-oriented wording and queued for reviewer confirmation.",
        status: "pending",
        createdAt: new Date().toISOString()
      })
    ];
  });

  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = `${suggestion.noteId}:${suggestion.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
