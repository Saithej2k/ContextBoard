import { describe, expect, it } from "vitest";
import { demoUsers, extractTaskSuggestions, noteSchema } from "./index.js";

describe("extractTaskSuggestions", () => {
  it("extracts owner, due label, and source excerpt from action language", () => {
    const note = noteSchema.parse({
      id: "note-test",
      workspaceId: "workspace-demo",
      authorId: "usr-sai",
      authorName: "Sai Patel",
      title: "Planning",
      body: "Maya to review onboarding copy by Friday. This sentence is only context.",
      tags: [],
      createdAt: "2026-06-03T12:00:00.000Z"
    });

    const [suggestion] = extractTaskSuggestions(note, demoUsers);

    expect(suggestion).toMatchObject({
      noteId: "note-test",
      title: "Review onboarding copy",
      ownerName: "Maya Chen",
      dueLabel: "Friday",
      sourceExcerpt: "Maya to review onboarding copy by Friday."
    });
  });

  it("skips ordinary notes without action intent", () => {
    const note = noteSchema.parse({
      id: "note-context",
      workspaceId: "workspace-demo",
      authorId: "usr-sai",
      authorName: "Sai Patel",
      title: "Context",
      body: "The team liked the revised workspace overview.",
      tags: [],
      createdAt: "2026-06-03T12:00:00.000Z"
    });

    expect(extractTaskSuggestions(note, demoUsers)).toEqual([]);
  });
});
