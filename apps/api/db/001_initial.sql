create extension if not exists pgcrypto;

create table if not exists workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists workspace_users (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  name text not null,
  role text not null,
  avatar_hue integer not null check (avatar_hue >= 0 and avatar_hue <= 360)
);

create table if not exists notes (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  author_id text not null references workspace_users(id),
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists task_suggestions (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  note_id text not null references notes(id) on delete cascade,
  title text not null,
  owner_name text,
  due_label text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  confidence numeric(4, 2) not null check (confidence >= 0 and confidence <= 1),
  source_excerpt text not null,
  rationale text not null,
  status text not null check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id text primary key,
  workspace_id text not null references workspaces(id) on delete cascade,
  suggestion_id text references task_suggestions(id),
  note_id text references notes(id),
  title text not null,
  owner_id text references workspace_users(id),
  owner_name text,
  due_label text,
  priority text not null check (priority in ('low', 'medium', 'high')),
  status text not null check (status in ('todo', 'in_progress', 'waiting', 'done')),
  source_excerpt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_workspace_created_idx on notes(workspace_id, created_at desc);
create index if not exists suggestions_workspace_status_idx on task_suggestions(workspace_id, status);
create index if not exists tasks_workspace_status_idx on tasks(workspace_id, status);

