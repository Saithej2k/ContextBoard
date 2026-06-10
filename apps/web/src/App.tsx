import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  Github,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Plus,
  RefreshCcw,
  Send,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import {
  type CreateNoteInput,
  type ReviewSuggestionInput,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type TaskSuggestion,
  type User,
  type WorkspaceSnapshot,
  pilotMetrics
} from "@contextboard/shared";
import { createNote, loadWorkspace, resetWorkspace, reviewSuggestion, updateTask } from "./workspaceClient";

const statusColumns: Array<{ id: TaskStatus; label: string }> = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "waiting", label: "Waiting" },
  { id: "done", label: "Done" }
];

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function initials(name?: string) {
  if (!name) {
    return "UN";
  }
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function metric(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}K+` : `${value}+`;
}

function AppShell({
  snapshot,
  onSnapshot,
  onReset
}: {
  snapshot: WorkspaceSnapshot;
  onSnapshot: (snapshot: WorkspaceSnapshot) => void;
  onReset: () => Promise<void>;
}) {
  const [selectedNoteId, setSelectedNoteId] = useState(snapshot.notes[0]?.id);
  const pendingSuggestions = snapshot.suggestions.filter((suggestion) => suggestion.status === "pending");
  const acceptedSuggestions = snapshot.suggestions.filter((suggestion) => suggestion.status === "accepted");
  const dismissedSuggestions = snapshot.suggestions.filter((suggestion) => suggestion.status === "dismissed");
  const selectedNote = snapshot.notes.find((note) => note.id === selectedNoteId) ?? snapshot.notes[0];

  useEffect(() => {
    if (!snapshot.notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(snapshot.notes[0]?.id);
    }
  }, [selectedNoteId, snapshot.notes]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <strong>ContextBoard</strong>
            <span>{snapshot.workspaceName}</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Workspace">
          <a href="#notes">
            <FileText size={18} />
            Notes
          </a>
          <a href="#review">
            <ShieldCheck size={18} />
            Review
          </a>
          <a href="#tasks">
            <ListChecks size={18} />
            Tasks
          </a>
          <a href="#digest">
            <ClipboardCheck size={18} />
            Digest
          </a>
        </nav>

        <div className="user-strip">
          {snapshot.users.map((user) => (
            <div className="user-row" key={user.id}>
              <span className="avatar" style={{ "--hue": user.avatarHue } as React.CSSProperties}>
                {initials(user.name)}
              </span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="workspace-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Pilot workspace</p>
            <h1>Notes, reviewed actions, weekly follow-up</h1>
          </div>
          <div className="topbar-actions">
            <a className="icon-link" href="https://github.com/Saithej2k/ContextBoard" target="_blank" rel="noreferrer">
              <Github size={18} />
              Repo
            </a>
            <button className="secondary-action" onClick={onReset} type="button">
              <RefreshCcw size={16} />
              Reset
            </button>
          </div>
        </header>

        <section className="metric-grid" aria-label="Pilot metrics">
          <MetricTile icon={<UserRound size={19} />} label="Beta users" value={pilotMetrics.betaUsers.toString()} />
          <MetricTile icon={<FileText size={19} />} label="Notes captured" value={metric(snapshot.metrics.notesCaptured)} />
          <MetricTile icon={<Check size={19} />} label="Tracked tasks" value={metric(snapshot.metrics.acceptedTasks)} />
          <MetricTile icon={<Clock3 size={19} />} label="Pilot length" value={`${snapshot.metrics.pilotWeeks} weeks`} />
        </section>

        <section className="work-grid">
          <div className="work-column">
            <NoteComposer users={snapshot.users} onCreate={async (input) => onSnapshot(await createNote(input))} />
            <NoteList
              notes={snapshot.notes}
              selectedNoteId={selectedNote?.id}
              onSelect={setSelectedNoteId}
              users={snapshot.users}
            />
          </div>

          <div className="work-column wide">
            <ReviewQueue
              suggestions={pendingSuggestions}
              notes={snapshot.notes}
              onReview={async (suggestion, input) => onSnapshot(await reviewSuggestion(suggestion, input))}
            />
            <SourceTrace selectedNote={selectedNote} suggestions={snapshot.suggestions} />
          </div>
        </section>

        <section className="status-row" aria-label="Review outcomes">
          <StatusPill label="Pending review" value={pendingSuggestions.length} tone="amber" />
          <StatusPill label="Accepted" value={acceptedSuggestions.length} tone="green" />
          <StatusPill label="Dismissed" value={dismissedSuggestions.length} tone="gray" />
        </section>

        <TaskBoard
          tasks={snapshot.tasks}
          users={snapshot.users}
          onUpdate={async (task, input) => onSnapshot(await updateTask(task, input))}
        />

        <WeeklyDigest snapshot={snapshot} />
      </section>
    </main>
  );
}

function MetricTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="metric-tile">
      <span>{icon}</span>
      <div>
        <strong>{value}</strong>
        <p>{label}</p>
      </div>
    </div>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: number; tone: "amber" | "green" | "gray" }) {
  return (
    <div className={`status-pill ${tone}`}>
      <span>{value}</span>
      {label}
    </div>
  );
}

function NoteComposer({ users, onCreate }: { users: User[]; onCreate: (input: CreateNoteInput) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorId, setAuthorId] = useState(users[0]?.id ?? "");
  const [tags, setTags] = useState("pilot");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    await onCreate({
      title: title.trim(),
      body: body.trim(),
      authorId,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    });
    setTitle("");
    setBody("");
    setIsSaving(false);
  }

  return (
    <section className="tool-panel" id="notes">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Capture</p>
          <h2>Shared note</h2>
        </div>
        <Plus size={18} />
      </div>
      <form className="note-form" onSubmit={handleSubmit}>
        <input
          aria-label="Note title"
          placeholder="Note title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <textarea
          aria-label="Note body"
          placeholder="Maya to review onboarding copy by Friday..."
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          rows={5}
        />
        <div className="form-row">
          <select aria-label="Author" value={authorId} onChange={(event) => setAuthorId(event.target.value)}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
          <input aria-label="Tags" value={tags} onChange={(event) => setTags(event.target.value)} />
        </div>
        <button className="primary-action" disabled={isSaving || !title.trim() || !body.trim()} type="submit">
          {isSaving ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
          Add note
        </button>
      </form>
    </section>
  );
}

function NoteList({
  notes,
  selectedNoteId,
  onSelect,
  users
}: {
  notes: WorkspaceSnapshot["notes"];
  selectedNoteId?: string;
  onSelect: (noteId: string) => void;
  users: User[];
}) {
  return (
    <section className="tool-panel note-list-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Latest</p>
          <h2>Notes</h2>
        </div>
        <FileText size={18} />
      </div>
      <div className="note-list">
        {notes.map((note) => {
          const user = users.find((candidate) => candidate.id === note.authorId);
          return (
            <button
              className={`note-card ${selectedNoteId === note.id ? "active" : ""}`}
              key={note.id}
              onClick={() => onSelect(note.id)}
              type="button"
            >
              <span className="note-card-top">
                <strong>{note.title}</strong>
                <ChevronRight size={16} />
              </span>
              <span className="note-meta">
                {user?.name ?? note.authorName} · {formatDate(note.createdAt)}
              </span>
              <span className="tag-row">
                {note.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ReviewQueue({
  suggestions,
  notes,
  onReview
}: {
  suggestions: TaskSuggestion[];
  notes: WorkspaceSnapshot["notes"];
  onReview: (suggestion: TaskSuggestion, input: ReviewSuggestionInput) => Promise<void>;
}) {
  return (
    <section className="tool-panel" id="review">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Review queue</p>
          <h2>Suggested actions</h2>
        </div>
        <ShieldCheck size={18} />
      </div>
      <div className="review-list">
        {suggestions.length === 0 ? (
          <div className="empty-state">
            <Archive size={20} />
            <strong>Queue clear</strong>
          </div>
        ) : (
          suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              noteTitle={notes.find((note) => note.id === suggestion.noteId)?.title ?? "Source note"}
              suggestion={suggestion}
              onReview={onReview}
            />
          ))
        )}
      </div>
    </section>
  );
}

function SuggestionCard({
  suggestion,
  noteTitle,
  onReview
}: {
  suggestion: TaskSuggestion;
  noteTitle: string;
  onReview: (suggestion: TaskSuggestion, input: ReviewSuggestionInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(suggestion.title);
  const [ownerName, setOwnerName] = useState(suggestion.ownerName ?? "");
  const [dueLabel, setDueLabel] = useState(suggestion.dueLabel ?? "");
  const [priority, setPriority] = useState<TaskPriority>(suggestion.priority);
  const [isSaving, setIsSaving] = useState(false);

  async function submit(decision: "accept" | "dismiss") {
    setIsSaving(true);
    await onReview(suggestion, {
      decision,
      title,
      ownerName: ownerName || undefined,
      dueLabel: dueLabel || undefined,
      priority
    });
    setIsSaving(false);
  }

  return (
    <article className="suggestion-card">
      <div className="card-header">
        <span className={`confidence ${suggestion.confidence > 0.8 ? "high" : "medium"}`}>
          {Math.round(suggestion.confidence * 100)}%
        </span>
        <span>{noteTitle}</span>
      </div>
      <input aria-label="Suggestion title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <div className="form-row">
        <input aria-label="Owner" placeholder="Owner" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
        <input aria-label="Due label" placeholder="Due" value={dueLabel} onChange={(event) => setDueLabel(event.target.value)} />
        <select aria-label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <blockquote>{suggestion.sourceExcerpt}</blockquote>
      <div className="button-row">
        <button className="primary-action compact" disabled={isSaving || !title.trim()} onClick={() => submit("accept")} type="button">
          <Check size={15} />
          Accept
        </button>
        <button className="secondary-action compact" disabled={isSaving} onClick={() => submit("dismiss")} type="button">
          <X size={15} />
          Dismiss
        </button>
      </div>
    </article>
  );
}

function SourceTrace({
  selectedNote,
  suggestions
}: {
  selectedNote?: WorkspaceSnapshot["notes"][number];
  suggestions: TaskSuggestion[];
}) {
  const related = suggestions.filter((suggestion) => suggestion.noteId === selectedNote?.id);

  return (
    <section className="tool-panel source-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Trace</p>
          <h2>{selectedNote?.title ?? "Source note"}</h2>
        </div>
        <Activity size={18} />
      </div>
      {selectedNote ? (
        <>
          <p className="note-body">{selectedNote.body}</p>
          <div className="trace-list">
            {related.map((suggestion) => (
              <div className="trace-item" key={suggestion.id}>
                <span className={`dot ${suggestion.status}`} />
                <span>{suggestion.title}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <FileText size={20} />
          <strong>No note selected</strong>
        </div>
      )}
    </section>
  );
}

function TaskBoard({
  tasks,
  users,
  onUpdate
}: {
  tasks: Task[];
  users: User[];
  onUpdate: (task: Task, input: Partial<Task>) => Promise<void>;
}) {
  const grouped = useMemo(
    () =>
      statusColumns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.id)
      })),
    [tasks]
  );

  return (
    <section className="task-section" id="tasks">
      <div className="section-heading inline">
        <div>
          <p className="eyebrow">Board</p>
          <h2>Tracked tasks</h2>
        </div>
        <ListChecks size={18} />
      </div>
      <div className="task-board">
        {grouped.map((column) => (
          <div className="task-column" key={column.id}>
            <div className="column-header">
              <strong>{column.label}</strong>
              <span>{column.tasks.length}</span>
            </div>
            <div className="task-list">
              {column.tasks.map((task) => (
                <TaskCard key={task.id} task={task} users={users} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  users,
  onUpdate
}: {
  task: Task;
  users: User[];
  onUpdate: (task: Task, input: Partial<Task>) => Promise<void>;
}) {
  return (
    <article className="task-card">
      <div className="task-title-row">
        <strong>{task.title}</strong>
        <span className={`priority ${task.priority}`}>{priorityLabels[task.priority]}</span>
      </div>
      <div className="task-controls">
        <select
          aria-label="Task owner"
          value={task.ownerName ?? ""}
          onChange={(event) => onUpdate(task, { ownerName: event.target.value || undefined })}
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.name}>
              {user.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Task status"
          value={task.status}
          onChange={(event) => onUpdate(task, { status: event.target.value as TaskStatus })}
        >
          {statusColumns.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
      </div>
      <p>{task.sourceExcerpt}</p>
      <span className="task-date">{task.dueLabel ?? formatDate(task.updatedAt)}</span>
    </article>
  );
}

function WeeklyDigest({ snapshot }: { snapshot: WorkspaceSnapshot }) {
  return (
    <section className="digest-section" id="digest">
      <div className="section-heading inline">
        <div>
          <p className="eyebrow">Weekly digest</p>
          <h2>{snapshot.digest.summary}</h2>
        </div>
        <ClipboardCheck size={18} />
      </div>
      <div className="digest-grid">
        <DigestList title="Wins" items={snapshot.digest.wins} />
        <DigestList title="Risks" items={snapshot.digest.risks} />
        <DigestList title="Follow-ups" items={snapshot.digest.followUps} />
      </div>
    </section>
  );
}

function DigestList({ title, items }: { title: string; items: WorkspaceSnapshot["digest"]["wins"] }) {
  return (
    <div className="digest-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">None</p>
      ) : (
        items.map((item) => (
          <div className="digest-item" key={item.id}>
            <strong>{item.label}</strong>
            <span>{item.ownerName ?? "Unassigned"}</span>
          </div>
        ))
      )}
    </div>
  );
}

export function App() {
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    loadWorkspace().then(setSnapshot).catch((caught) => setError(caught instanceof Error ? caught.message : "Load failed"));
  }, []);

  async function handleReset() {
    setSnapshot(resetWorkspace());
  }

  if (error) {
    return (
      <main className="center-state">
        <X size={24} />
        <strong>{error}</strong>
      </main>
    );
  }

  if (!snapshot) {
    return (
      <main className="center-state">
        <Loader2 className="spin" size={26} />
        <strong>Loading workspace</strong>
      </main>
    );
  }

  return <AppShell snapshot={snapshot} onSnapshot={setSnapshot} onReset={handleReset} />;
}

