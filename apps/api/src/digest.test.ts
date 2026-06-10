import { describe, expect, it } from "vitest";
import { demoTasks } from "@contextboard/shared";
import { buildWeeklyDigest } from "./digest.js";

describe("buildWeeklyDigest", () => {
  it("groups completed, waiting, and active work", () => {
    const digest = buildWeeklyDigest("workspace-demo", demoTasks);

    expect(digest.summary).toContain("completed");
    expect(digest.wins).toHaveLength(1);
    expect(digest.risks[0].status).toBe("waiting");
    expect(digest.followUps.length).toBeGreaterThan(0);
  });
});
