import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { createNoteSchema, reviewSuggestionSchema, updateTaskSchema } from "@contextboard/shared";
import type { ContextBoardRepository } from "./repository.js";

const defaultWorkspaceId = "workspace-demo";

function workspaceId(request: Request) {
  return param(request, "workspaceId") ?? defaultWorkspaceId;
}

function param(request: Request, key: string) {
  const value = request.params[key];
  return Array.isArray(value) ? value[0] : value;
}

function handleError(error: unknown, response: Response) {
  const message = error instanceof Error ? error.message : "Unexpected request failure";
  const status = /not found/i.test(message) ? 404 : /unknown user/i.test(message) ? 400 : 500;
  response.status(status).json({ error: message });
}

export function contextBoardRoutes(repository: ContextBoardRepository): Router {
  const router = createRouter();

  router.get("/workspaces/:workspaceId", async (request, response) => {
    try {
      response.json(await repository.getSnapshot(workspaceId(request)));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.post("/workspaces/:workspaceId/notes", async (request, response) => {
    try {
      const input = createNoteSchema.parse(request.body);
      response.status(201).json(await repository.createNote(workspaceId(request), input));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.post("/workspaces/:workspaceId/suggestions/:suggestionId/review", async (request, response) => {
    try {
      const input = reviewSuggestionSchema.parse(request.body);
      response.json(await repository.reviewSuggestion(workspaceId(request), param(request, "suggestionId") ?? "", input));
    } catch (error) {
      handleError(error, response);
    }
  });

  router.patch("/workspaces/:workspaceId/tasks/:taskId", async (request, response) => {
    try {
      const input = updateTaskSchema.parse(request.body);
      response.json(await repository.updateTask(workspaceId(request), param(request, "taskId") ?? "", input));
    } catch (error) {
      handleError(error, response);
    }
  });

  return router;
}
