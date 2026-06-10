# ContextBoard Architecture

ContextBoard is a small monorepo with a React client, Node API, PostgreSQL schema, and shared TypeScript contracts. The product centers on a review queue: note-derived task suggestions are editable records until a reviewer accepts or dismisses them.

## System Shape

```mermaid
flowchart LR
  A["React workspace"] --> B["API client"]
  B --> C["Express API"]
  C --> D["PostgreSQL"]
  C --> E["Suggestion parser"]
  D --> C
  C --> F["Weekly digest builder"]
```

## Review Before Automation

Task suggestions are stored separately from accepted tasks. Reviewers can edit title, owner, status, due date, and source excerpt before converting a suggestion into a tracked task. This protects the workspace from silent automation drift while keeping source traceability.

## Deployment Model

The public demo is deployed through GitHub Pages. The AWS deployment path builds the API Docker image in GitHub Actions, pushes it to ECR, deploys ECS Fargate behind an Application Load Balancer, and provisions PostgreSQL on Amazon RDS. Once the workflow writes `VITE_API_URL`, the Pages build points at the hosted API instead of browser-local demo state.

## Data Model

- `notes` store the original shared text and tags.
- `task_suggestions` store reviewable candidates with confidence, rationale, status, and source excerpt.
- `tasks` store accepted work items and retain optional links back to suggestions and notes.
- `workspace_users` keep assignment metadata separate from notes and tasks.

This keeps dismissed suggestions auditable without polluting the active task board.
