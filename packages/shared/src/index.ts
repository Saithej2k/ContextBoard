export const pilotMetrics = {
  betaUsers: 11,
  notesCaptured: 1427,
  acceptedTasks: 320,
  pilotWeeks: 8
} as const;

export type TaskStatus = "todo" | "in_progress" | "waiting" | "done";
export type SuggestionStatus = "pending" | "accepted" | "dismissed";
export type TaskPriority = "low" | "medium" | "high";

