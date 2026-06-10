import type { Task, WeeklyDigest } from "@contextboard/shared";

export function buildWeeklyDigest(workspaceId: string, tasks: Task[]): WeeklyDigest {
  const done = tasks.filter((task) => task.status === "done");
  const waiting = tasks.filter((task) => task.status === "waiting");
  const open = tasks.filter((task) => task.status !== "done");

  return {
    workspaceId,
    generatedAt: new Date().toISOString(),
    summary: `${done.length} completed, ${open.length} open, ${waiting.length} waiting on another owner or decision.`,
    wins: done.slice(0, 5).map((task) => ({
      id: `win-${task.id}`,
      label: task.title,
      detail: task.sourceExcerpt ?? "Completed task.",
      ownerName: task.ownerName,
      status: task.status
    })),
    risks: waiting.slice(0, 5).map((task) => ({
      id: `risk-${task.id}`,
      label: task.title,
      detail: task.dueLabel ?? "Waiting for unblock.",
      ownerName: task.ownerName,
      status: task.status
    })),
    followUps: open.slice(0, 8).map((task) => ({
      id: `follow-${task.id}`,
      label: task.title,
      detail: task.sourceExcerpt ?? "Open follow-up.",
      ownerName: task.ownerName,
      status: task.status
    }))
  };
}

