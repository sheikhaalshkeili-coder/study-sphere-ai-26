import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Pencil, Trash2, X, Target, Loader2 } from "lucide-react";
import {
  useClasses, useGrades, useSaveGrade, useDeleteGrade, type GradeRow,
} from "@/hooks/use-study-data";
import { computeGpa, weightedPercent, percentToPoints, letterFor, GRADE_CATEGORIES } from "@/lib/gpa";
import { colorOf } from "@/lib/schedule";

export const Route = createFileRoute("/app/grades")({
  head: () => ({
    meta: [
      { title: "Grades & GPA — StudySphere" },
      { name: "description", content: "Track every quiz, test and project grade and see your real GPA update instantly." },
      { property: "og:title", content: "Grades & GPA — StudySphere" },
      { property: "og:description", content: "Track every quiz, test and project grade and see your real GPA update instantly." },
    ],
  }),
  component: Grades,
});

type Draft = {
  id?: string;
  class_id: string;
  title: string;
  category: string;
  score: string;
  max_score: string;
  weight: string;
  graded_at: string;
};

function todayInput() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function emptyDraft(classId = ""): Draft {
  return { class_id: classId, title: "", category: "quiz", score: "", max_score: "100", weight: "1", graded_at: todayInput() };
}

function Grades() {
  const { data: grades = [], isLoading } = useGrades();
  const { data: classes = [] } = useClasses();
  const save = useSaveGrade();
  const del = useDeleteGrade();
  const [draft, setDraft] = useState<Draft | null>(null);

  const gpa = useMemo(() => computeGpa(grades), [grades]);

  const byClass = useMemo(() => {
    const map = new Map<string, GradeRow[]>();
    for (const g of grades) {
      const key = g.class_id ?? "";
      const list = map.get(key);
      if (list) list.push(g);
      else map.set(key, [g]);
    }
    return Array.from(map.entries());
  }, [grades]);

  const scoreNum = Number(draft?.score);
  const maxNum = Number(draft?.max_score);
  const weightNum = Number(draft?.weight);
  const valid =
    !!draft?.title.trim() &&
    Number.isFinite(scoreNum) && draft.score !== "" && scoreNum >= 0 &&
    Number.isFinite(maxNum) && maxNum > 0 &&
    Number.isFinite(weightNum) && weightNum > 0;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <Link to="/app/study" aria-label="Back to Study Hub" className="grid size-10 place-items-center rounded-3xl bg-card shadow-soft">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">Grades</h1>
          <p className="text-xs text-muted-foreground">Your GPA is calculated from these entries</p>
        </div>
        <button
          onClick={() => setDraft(emptyDraft())}
          aria-label="Add grade"
          className="grid size-11 place-items-center rounded-3xl bg-gradient-brand text-white shadow-glow active:scale-95"
        >
          <Plus className="size-5" />
        </button>
      </div>

      <div className="mt-5 rounded-3xl bg-gradient-brand p-5 text-center text-white shadow-glow">
        <Target className="mx-auto size-5 opacity-80" />
        {gpa ? (
          <>
            <p className="mt-2 font-display text-4xl font-bold">{gpa.gpa.toFixed(2)}</p>
            <p className="text-xs opacity-80">GPA across {gpa.classCount} {gpa.classCount === 1 ? "class" : "classes"} · 4.0 scale</p>
          </>
        ) : (
          <>
            <p className="mt-2 font-display text-lg font-bold">No GPA yet</p>
            <p className="text-xs opacity-80">Add your first grade and your GPA appears here instantly.</p>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : grades.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-6 text-center">
          <p className="text-sm font-semibold">No grades yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add a quiz, test or project score — weights are optional and default to 1.
          </p>
          <button
            onClick={() => setDraft(emptyDraft())}
            className="mt-4 rounded-3xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            Add your first grade
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {byClass.map(([classId, list]) => {
            const cls = classes.find((c) => c.id === classId);
            const pct = weightedPercent(list);
            return (
              <div key={classId || "none"}>
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: cls ? colorOf(cls.color) : "var(--muted-foreground)" }} />
                  <p className="flex-1 font-display text-sm font-bold">{cls?.subject ?? "Unassigned"}</p>
                  {pct !== null && (
                    <p className="text-xs font-semibold text-muted-foreground">
                      {pct.toFixed(1)}% · {letterFor(pct)} · {percentToPoints(pct).toFixed(1)}
                    </p>
                  )}
                </div>
                <div className="mt-2 space-y-2">
                  {list.map((g) => {
                    const p = (g.score / g.max_score) * 100;
                    return (
                      <div key={g.id} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{g.title}</p>
                          <p className="text-[11px] capitalize text-muted-foreground">
                            {g.category} · {new Date(g.graded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            {g.weight !== 1 ? ` · weight ${g.weight}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-sm font-bold">{g.score}/{g.max_score}</p>
                          <p className="text-[11px] text-muted-foreground">{p.toFixed(0)}%</p>
                        </div>
                        <button
                          onClick={() => setDraft({
                            id: g.id, class_id: g.class_id ?? "", title: g.title, category: g.category,
                            score: String(g.score), max_score: String(g.max_score), weight: String(g.weight),
                            graded_at: g.graded_at.slice(0, 10),
                          })}
                          aria-label="Edit grade"
                          className="grid size-9 shrink-0 place-items-center rounded-3xl bg-muted/60 active:scale-95"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => del.mutate(g.id)}
                          aria-label="Delete grade"
                          className="grid size-9 shrink-0 place-items-center rounded-3xl bg-destructive/10 text-destructive active:scale-95"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
          <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
            <div className="flex items-center justify-between">
              <p className="font-display text-lg font-bold">{draft.id ? "Edit grade" : "Add grade"}</p>
              <button onClick={() => setDraft(null)} aria-label="Close" className="grid size-9 place-items-center rounded-3xl bg-muted/60">
                <X className="size-4" />
              </button>
            </div>

            <Field label="Title">
              <input
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="Chapter 4 quiz"
                className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
              />
            </Field>

            <Field label="Class">
              <select
                value={draft.class_id}
                onChange={(e) => setDraft({ ...draft, class_id: e.target.value })}
                className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
              >
                <option value="">No class</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.subject}</option>)}
              </select>
            </Field>

            <Field label="Type">
              <div className="grid grid-cols-3 gap-2">
                {GRADE_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft({ ...draft, category: c })}
                    className={`rounded-3xl py-2.5 text-xs font-semibold capitalize transition ${
                      draft.category === c ? "bg-gradient-brand text-white shadow-glow" : "bg-muted/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Score">
                <input
                  type="number" inputMode="decimal" value={draft.score}
                  onChange={(e) => setDraft({ ...draft, score: e.target.value })}
                  className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Out of">
                <input
                  type="number" inputMode="decimal" value={draft.max_score}
                  onChange={(e) => setDraft({ ...draft, max_score: e.target.value })}
                  className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
                />
              </Field>
              <Field label="Weight">
                <input
                  type="number" inputMode="decimal" step="0.1" value={draft.weight}
                  onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                  className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
                />
              </Field>
            </div>

            <Field label="Date">
              <input
                type="date" value={draft.graded_at}
                onChange={(e) => setDraft({ ...draft, graded_at: e.target.value })}
                className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
              />
            </Field>

            <button
              disabled={!valid || save.isPending}
              onClick={async () => {
                await save.mutateAsync({
                  id: draft.id,
                  class_id: draft.class_id || null,
                  title: draft.title.trim(),
                  category: draft.category,
                  score: scoreNum,
                  max_score: maxNum,
                  weight: weightNum,
                  graded_at: draft.graded_at || todayInput(),
                });
                setDraft(null);
              }}
              className="mt-4 w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
            >
              {save.isPending ? "Saving…" : draft.id ? "Save changes" : "Add grade"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mt-3 block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
