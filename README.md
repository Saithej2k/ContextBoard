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

To run against PostgreSQL, create a local database and apply the migration in `apps/api/db/001_initial.sql`, or use the connection string in `.env.example`.

## Scripts

```bash
npm run build
npm run check
npm run lint
npm run test
```

