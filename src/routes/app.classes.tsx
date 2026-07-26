import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, GraduationCap, Loader2 } from "lucide-react";
import {
  useClasses,
  useSaveClass,
  useDeleteClass,
  type ClassRow,
} from "@/hooks/use-study-data";
import { CLASS_COLORS, DAYS, colorOf, formatTime } from "@/lib/schedule";

export const Route = createFileRoute("/app/classes")({
  component: ClassesPage,
});

type Draft = {
  id?: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

const emptyDraft: Draft = {
  subject: "",
  teacher: "",
  room: "",
  color: "blue",
  day_of_week: 1,
  start_time: "09:00",
  end_time: "10:00",
};

function ClassesPage() {
  const { data: classes = [], isLoading } = useClasses();
  const save = useSaveClass();
  const remove = useDeleteClass();
  const [draft, setDraft] = useState<Draft | null>(null);

  function openEdit(c: ClassRow) {
    setDraft({
      id: c.id,
      subject: c.subject,
      teacher: c.teacher ?? "",
      room: c.room ?? "",
      color: c.color ?? "blue",
      day_of_week: c.day_of_week ?? 1,
      start_time: (c.start_time ?? "09:00").slice(0, 5),
      end_time: (c.end_time ?? "10:00").slice(0, 5),
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    await save.mutateAsync({ ...draft, subject: draft.subject.trim() });
    setDraft(null);
  }

  const grouped = DAYS.map((label, day) => ({
    label,
    day,
    items: classes.filter((c) => (c.day_of_week ?? -1) === day),
  })).filter((g) => g.items.length > 0);

  const unscheduled = classes.filter((c) => c.day_of_week === null);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            to="/app/planner"
            aria-label="Back to planner"
            className="grid size-9 place-items-center rounded-2xl bg-card shadow-soft active:scale-95"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">My classes</h1>
            <p className="text-xs text-muted-foreground">Your real timetable</p>
          </div>
        </div>
        <button
          onClick={() => setDraft(emptyDraft)}
          aria-label="Add class"
          className="grid size-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow active:scale-95"
        >
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && classes.length === 0 && (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
          <GraduationCap className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">No classes yet</p>
          <p className="text-xs text-muted-foreground">Add your first class to build your timetable.</p>
          <button
            onClick={() => setDraft(emptyDraft)}
            className="mt-4 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow"
          >
            Add a class
          </button>
        </div>
      )}

      <div className="mt-5 space-y-5">
        {grouped.map((g) => (
          <div key={g.day}>
            <h2 className="font-display text-sm font-bold text-muted-foreground">{g.label}</h2>
            <div className="mt-2 space-y-2.5">
              {g.items.map((c) => (
                <ClassCard key={c.id} c={c} onEdit={() => openEdit(c)} onDelete={() => remove.mutate(c.id)} />
              ))}
            </div>
          </div>
        ))}
        {unscheduled.length > 0 && (
          <div>
            <h2 className="font-display text-sm font-bold text-muted-foreground">No set day</h2>
            <div className="mt-2 space-y-2.5">
              {unscheduled.map((c) => (
                <ClassCard key={c.id} c={c} onEdit={() => openEdit(c)} onDelete={() => remove.mutate(c.id)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <button className="absolute inset-0" aria-label="Close" onClick={() => setDraft(null)} />
          <form
            onSubmit={submit}
            className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
            <h2 className="font-display text-lg font-bold">{draft.id ? "Edit class" : "New class"}</h2>

            <label className="mt-4 block text-xs font-semibold">Subject</label>
            <input
              required
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              placeholder="Biology"
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            />

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold">Teacher</label>
                <input
                  value={draft.teacher}
                  onChange={(e) => setDraft({ ...draft, teacher: e.target.value })}
                  placeholder="Ms. Rivera"
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Room</label>
                <input
                  value={draft.room}
                  onChange={(e) => setDraft({ ...draft, room: e.target.value })}
                  placeholder="Lab 2"
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <label className="mt-3 block text-xs font-semibold">Day</label>
            <select
              value={draft.day_of_week}
              onChange={(e) => setDraft({ ...draft, day_of_week: Number(e.target.value) })}
              className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {DAYS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold">Starts</label>
                <input
                  type="time"
                  value={draft.start_time}
                  onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold">Ends</label>
                <input
                  type="time"
                  value={draft.end_time}
                  onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
            </div>

            <label className="mt-3 block text-xs font-semibold">Colour</label>
            <div className="mt-2 flex gap-2.5">
              {CLASS_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  aria-label={c.name}
                  onClick={() => setDraft({ ...draft, color: c.name })}
                  className={`size-8 rounded-full transition ${draft.color === c.name ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                  style={{ background: c.value }}
                />
              ))}
            </div>

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
                {save.isPending ? "Saving…" : draft.id ? "Save changes" : "Add class"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function ClassCard({ c, onEdit, onDelete }: { c: ClassRow; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
      <div className="h-11 w-1.5 rounded-full" style={{ background: colorOf(c.color) }} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{c.subject}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[formatTime(c.start_time) && `${formatTime(c.start_time)}–${formatTime(c.end_time)}`, c.room, c.teacher]
            .filter(Boolean)
            .join(" · ") || "No details yet"}
        </p>
      </div>
      <button onClick={onEdit} aria-label={`Edit ${c.subject}`} className="grid size-9 place-items-center rounded-xl bg-accent">
        <Pencil className="size-4 text-primary" />
      </button>
      <button onClick={onDelete} aria-label={`Delete ${c.subject}`} className="grid size-9 place-items-center rounded-xl bg-destructive/10">
        <Trash2 className="size-4 text-destructive" />
      </button>
    </div>
  );
}
