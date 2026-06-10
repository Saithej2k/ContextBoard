# API Notes

The API returns a full workspace snapshot after write operations so the client can update state without stitching partial responses together.

## Create Note

`POST /api/workspaces/workspace-demo/notes`

```json
{
  "title": "Launch recap",
  "body": "Nora to send the recap by Friday.",
  "authorId": "usr-nora",
  "tags": ["launch"]
}
```

## Review Suggestion

`POST /api/workspaces/workspace-demo/suggestions/:suggestionId/review`

```json
{
  "decision": "accept",
  "title": "Send launch recap",
  "ownerName": "Nora Diaz",
  "dueLabel": "Friday",
  "priority": "medium"
}
```

Use `"decision": "dismiss"` to close the suggestion without creating a task.

## Update Task

`PATCH /api/workspaces/workspace-demo/tasks/:taskId`

```json
{
  "status": "waiting",
  "ownerName": "Jules Avery"
}
```

