# ContextBoard

Collaborative notes and action review workspace for teams that need traceable follow-up without turning every note into an unchecked task.

| Link | URL |
| --- | --- |
| Demo | https://saithej2k.github.io/ContextBoard/ |
| Repo | https://github.com/Saithej2k/ContextBoard |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Product note | [docs/product-note.md](docs/product-note.md) |

## What It Does

ContextBoard gives a small team one place to capture shared notes, review suggested action items, assign owners, and prepare weekly follow-up digests. Each task keeps a source note reference so reviewers can see where the action came from before accepting it.

The shipped demo includes seeded pilot data for 11 beta users, 1.4K+ captured notes, and 320+ tracked tasks from an 8-week validation period.

## Stack

- React, TypeScript, and Vite for the workspace UI
- Node.js and Express for the API
- PostgreSQL for notes, suggestions, tasks, and digest history
- Zod schemas shared across client and server

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

The web app runs on `http://localhost:5173` and the API runs on `http://localhost:4100`.

To run against PostgreSQL:

```bash
createdb contextboard
psql "$DATABASE_URL" -f apps/api/db/001_initial.sql
npm run seed -w apps/api
```

Without `DATABASE_URL`, the API serves the seeded demo workspace from memory. The GitHub Pages demo uses the same seeded data in browser storage.

## Scripts

```bash
npm run build
npm run check
npm run lint
npm run test
```

## API Surface

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Service and storage health |
| `GET` | `/api/workspaces/:workspaceId` | Full workspace snapshot |
| `POST` | `/api/workspaces/:workspaceId/notes` | Create a note and queue task suggestions |
| `POST` | `/api/workspaces/:workspaceId/suggestions/:suggestionId/review` | Accept or dismiss a suggestion |
| `PATCH` | `/api/workspaces/:workspaceId/tasks/:taskId` | Update task owner, priority, due label, or status |

## Deployment

The public demo deploys through GitHub Pages from `.github/workflows/pages.yml`. Hosted API deployment needs a Node runtime and `DATABASE_URL`; the API container in `apps/api/Dockerfile` is ready for services such as Render, Fly.io, Railway, or a private container host.
