import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Check, CalendarDays, AlertCircle, Loader2, Trash2, GraduationCap, LayoutList } from "lucide-react";
import {
  useClasses,
  useAssignments,
  useExams,
  useSaveTask,
  useToggleDone,
  useDeleteTask,
} from "@/hooks/use-study-data";
import {
  BUCKETS,
  TASK_TYPES,
  bucketFor,
  colorOf,
  formatDue,
  fromLocalInput,
  type Bucket,
} from "@/lib/schedule";

export const Route = createFileRoute("/app/planner")({
  head: () => ({
    meta: [
      { title: "Planner — StudySphere" },
      { name: "description", content: "Track homework, quizzes, projects and exams with real due dates." },
      { property: "og:title", content: "Planner — StudySphere" },
      { property: "og:description", content: "Track homework, quizzes, projects and exams with real due dates." },
    ],
  }),
  component: Planner,
});


type Row = {
  id: string;
  kind: "task" | "exam";
  title: string;
  subject: string | null;
  type: string;
  priority: string;
  date: string | null;
  done: boolean;
  color: string;
};

const priorityStyle: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  med: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

type Draft = {
  kind: "task" | "exam";
  title: string;
  type: string;
  class_id: string;
  due_at: string;
  priority: string;
  notes: string;
};

const emptyDraft: Draft = {
  kind: "task",
  title: "",
  type: "assignment",
  class_id: "",
  due_at: "",
  priority: "med",
  notes: "",
};

function Planner() {
  const [filter, setFilter] = useState<Bucket>("Today");
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: classes = [] } = useClasses();
  const { data: assignments = [], isLoading: la } = useAssignments();
  const { data: exams = [], isLoading: le } = useExams();
  const save = useSaveTask();
  const toggle = useToggleDone();
  const remove = useDeleteTask();

  const rows: Row[] = useMemo(() => {
    const classColor = (id: string | null) =>
      colorOf(classes.find((c) => c.id === id)?.color ?? null);
    const a: Row[] = assignments.map((x) => ({
      id: x.id,
      kind: "task",
      title: x.title,
      subject: x.subject ?? classes.find((c) => c.id === x.class_id)?.subject ?? null,
      type: x.type,
      priority: x.priority,
      date: x.due_at,
      done: x.done,
      color: classColor(x.class_id),
    }));
    const e: Row[] = exams.map((x) => ({
      id: x.id,
      kind: "exam",
      title: x.title,
      subject: x.subject ?? classes.find((c) => c.id === x.class_id)?.subject ?? null,
      type: "exam",
      priority: "high",
      date: x.exam_at,
      done: false,
      color: classColor(x.class_id),
    }));
    return [...a, ...e].sort((p, q) => (p.date ?? "").localeCompare(q.date ?? ""));
  }, [assignments, exams, classes]);

  const counts = Object.fromEntries(
    BUCKETS.map((b) => [b, rows.filter((r) => bucketFor(r.date, r.done) === b).length]),
  ) as Record<Bucket, number>;

  const shown = rows.filter((r) => bucketFor(r.date, r.done) === filter);
  const loading = la || le;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const cls = classes.find((c) => c.id === draft.class_id);
    await save.mutateAsync({
      kind: draft.kind,
      title: draft.title.trim(),
      type: draft.kind === "exam" ? "assignment" : draft.type,
      class_id: draft.class_id || null,
      subject: cls?.subject ?? null,
      due_at: fromLocalInput(draft.due_at),
      priority: draft.priority,
      notes: draft.notes.trim() || null,
    });
    setDraft(null);
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Planner</h1>
          <p className="text-xs text-muted-foreground">Homework, quizzes & exams</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/app/classes"
            aria-label="My classes"
            className="grid size-11 place-items-center rounded-3xl bg-card shadow-soft active:scale-95"
          >
            <LayoutList className="size-5 text-primary" />
          </Link>
          <button
            onClick={() => setDraft(emptyDraft)}
            aria-label="Add item"
            className="grid size-11 place-items-center rounded-3xl bg-gradient-brand text-white shadow-glow active:scale-95"
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {BUCKETS.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft"
              }`}
            >
              {f}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}>
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Items */}
      {!loading && (
        <div className="mt-4 space-y-2.5">
          {shown.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center">
              <CalendarDays className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-semibold">Nothing here!</p>
              <p className="text-xs text-muted-foreground">
                {rows.length === 0 ? "Tap + to add your first task." : "You're all caught up 🎉"}
              </p>
            </div>
          )}
          {shown.map((i) => (
            <div key={`${i.kind}-${i.id}`} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
              {i.kind === "task" ? (
                <button
                  aria-label={i.done ? `Mark ${i.title} not done` : `Mark ${i.title} done`}
                  onClick={() => toggle.mutate({ id: i.id, done: !i.done })}
                  className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition ${
                    i.done ? "border-primary bg-gradient-brand" : "border-border bg-background"
                  }`}
                >
                  {i.done && <Check className="size-4 text-white" strokeWidth={3} />}
                </button>
              ) : (
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent">
                  <GraduationCap className="size-4 text-primary" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${i.done ? "text-muted-foreground line-through" : ""}`}>
                  {i.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  <span style={{ color: i.color }}>●</span> {[i.subject, i.kind === "exam" ? "Exam" : i.type].filter(Boolean).join(" · ")} · {formatDue(i.date)}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyle[i.priority] ?? priorityStyle.med}`}>
                {i.kind === "exam" ? "exam" : i.priority}
              </span>
              <button
                aria-label={`Delete ${i.title}`}
                onClick={() => remove.mutate({ id: i.id, kind: i.kind })}
                className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10"
              >
                <Trash2 className="size-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filter === "Overdue" && shown.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-3xl bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            You have overdue work. Tap the AI button to auto-generate a catch-up plan.
          </p>
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <button className="absolute inset-0" aria-label="Close" onClick={() => setDraft(null)} />
          <form
            onSubmit={submit}
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h2 className="font-display text-lg font-bold">New item</h2>

            <div className="mt-3 flex flex-wrap gap-2">
              {[...TASK_TYPES, "exam"].map((t) => {
                const active = draft.kind === "exam" ? t === "exam" : draft.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, kind: t === "exam" ? "exam" : "task", type: t === "exam" ? draft.type : t })
                    }
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                      active ? "bg-gradient-brand text-white shadow-glow" : "bg-card text-muted-foreground shadow-soft"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <label className="mt-4 block text-xs font-semibold">Title</label>
            <input
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Titration lab report"
              className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <label className="mt-3 block text-xs font-semibold">Class</label>
            <select
              value={draft.class_id}
              onChange={(e) => setDraft({ ...draft, class_id: e.target.value })}
              className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">No class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.subject}</option>
              ))}
            </select>
            {classes.length === 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                <Link to="/app/classes" className="font-semibold text-primary">Add your classes</Link> to link work to them.
              </p>
            )}

            <label className="mt-3 block text-xs font-semibold">
              {draft.kind === "exam" ? "Exam date & time" : "Due date & time"}
            </label>
            <input
              type="datetime-local"
              required={draft.kind === "exam"}
              value={draft.due_at}
              onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
              className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />

            {draft.kind === "task" && (
              <>
                <label className="mt-3 block text-xs font-semibold">Priority</label>
                <div className="mt-1 flex gap-2">
                  {["low", "med", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setDraft({ ...draft, priority: p })}
                      className={`flex-1 rounded-3xl py-2.5 text-xs font-semibold capitalize transition ${
                        draft.priority === p ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="mt-3 block text-xs font-semibold">Notes</label>
            <textarea
              rows={3}
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Optional details"
              className="mt-1 w-full resize-none rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="flex-1 rounded-full border border-border py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={save.isPending}
                className="flex-1 rounded-full bg-gradient-brand py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-70"
              >
                {save.isPending ? "Saving…" : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
