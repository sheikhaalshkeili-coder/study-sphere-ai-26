import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Timer, Layers, FileText, Play, Pause, RotateCcw, Plus, Trash2, Pencil,
  Sparkles, GraduationCap, ChevronRight, X, Loader2, BrainCircuit, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  useClasses, useFlashcards, useGrades, useNotes, useSaveFlashcard, useSaveNote,
  useDeleteFlashcard, useDeleteNote, useStudySessions, useLogStudySession,
  type FlashcardRow, type NoteRow,
} from "@/hooks/use-study-data";
import { computeGpa } from "@/lib/gpa";
import { colorOf } from "@/lib/schedule";

export const Route = createFileRoute("/app/study")({
  head: () => ({
    meta: [
      { title: "Study Hub — StudySphere" },
      { name: "description", content: "Focus timer, your own notes and flashcards, and AI quizzes built from your material." },
      { property: "og:title", content: "Study Hub — StudySphere" },
      { property: "og:description", content: "Focus timer, your own notes and flashcards, and AI quizzes built from your material." },
    ],
  }),
  component: Study,
});

const tools = [
  { id: "focus", icon: Timer, label: "Focus", desc: "Pomodoro timer", tint: "oklch(0.65 0.18 200)" },
  { id: "flash", icon: Layers, label: "Flashcards", desc: "Your own cards", tint: "oklch(0.6 0.22 300)" },
  { id: "quiz", icon: BrainCircuit, label: "AI Quiz", desc: "From your material", tint: "oklch(0.6 0.2 275)" },
  { id: "notes", icon: FileText, label: "Notes", desc: "Organize by class", tint: "oklch(0.65 0.18 250)" },
] as const;

function Study() {
  const [active, setActive] = useState<(typeof tools)[number]["id"]>("focus");
  const { data: grades = [] } = useGrades();
  const gpa = useMemo(() => computeGpa(grades), [grades]);

  return (
    <div className="px-5 pt-6">
      <h1 className="font-display text-2xl font-bold">Study Hub</h1>
      <p className="text-xs text-muted-foreground">Everything you need to learn better</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-3xl p-4 text-left shadow-soft transition active:scale-[0.98] ${
              active === t.id ? "ring-2 ring-primary" : ""
            }`}
            style={{ background: `color-mix(in oklab, ${t.tint} 10%, var(--card))` }}
          >
            <div className="grid size-10 place-items-center rounded-3xl" style={{ background: `color-mix(in oklab, ${t.tint} 22%, var(--card))` }}>
              <t.icon className="size-5" style={{ color: t.tint }} strokeWidth={2.2} />
            </div>
            <p className="mt-3 font-display text-sm font-bold">{t.label}</p>
            <p className="text-[11px] text-muted-foreground">{t.desc}</p>
          </button>
        ))}
      </div>

      <div className="mt-6">
        {active === "focus" && <Focus />}
        {active === "flash" && <Flashcards />}
        {active === "quiz" && <AIQuiz />}
        {active === "notes" && <Notes />}
      </div>

      <Link to="/app/grades" className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
        <div className="grid size-11 place-items-center rounded-3xl bg-accent">
          <GraduationCap className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Current GPA</p>
          <p className="font-display text-lg font-bold">
            {gpa ? gpa.gpa.toFixed(2) : <span className="text-xs font-medium text-muted-foreground">No GPA available yet — add grades</span>}
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const PRESETS = [15, 25, 50];

function Focus() {
  const { data: classes = [] } = useClasses();
  const { data: sessions = [] } = useStudySessions();
  const log = useLogStudySession();

  const [length, setLength] = useState(25);
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [classId, setClassId] = useState("");
  const startedAt = useRef<string | null>(null);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  useEffect(() => {
    if (secs !== 0 || !running) return;
    setRunning(false);
    log.mutate({ minutes: length, class_id: classId || null, started_at: startedAt.current ?? new Date().toISOString() });
    startedAt.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs, running]);

  function toggle() {
    if (!running && !startedAt.current) startedAt.current = new Date().toISOString();
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    setSecs(length * 60);
    startedAt.current = null;
  }

  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");
  const pct = 1 - secs / (length * 60);
  const C = 2 * Math.PI * 92;

  const todayMinutes = sessions
    .filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString())
    .reduce((a, s) => a + s.minutes, 0);
  const todayCount = sessions.filter((s) => new Date(s.started_at).toDateString() === new Date().toDateString()).length;
  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);

  return (
    <div className="rounded-3xl bg-gradient-soft p-6">
      <div className="flex justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => { setLength(p); setSecs(p * 60); setRunning(false); startedAt.current = null; }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              length === p ? "bg-gradient-brand text-white shadow-glow" : "bg-card"
            }`}
          >
            {p} min
          </button>
        ))}
      </div>

      <div className="relative mx-auto mt-4 grid size-56 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" strokeWidth="10" className="fill-none stroke-border" />
          <circle
            cx="100" cy="100" r="92" strokeWidth="10"
            className="fill-none" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
            style={{ stroke: "url(#g)" }}
          />
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.19 255)" />
              <stop offset="100%" stopColor="oklch(0.58 0.22 300)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="text-center">
          <p className="font-display text-5xl font-bold tabular-nums">{mm}:{ss}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Study session</p>
        </div>
      </div>

      {classes.length > 0 && (
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="mx-auto mt-4 block rounded-full border border-border bg-card px-4 py-2 text-xs font-medium"
        >
          <option value="">No class</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.subject}</option>)}
        </select>
      )}

      <div className="mt-5 flex items-center justify-center gap-3">
        <button onClick={reset} className="grid size-12 place-items-center rounded-full bg-card shadow-soft active:scale-95">
          <RotateCcw className="size-4" />
        </button>
        <button onClick={toggle} className="grid size-16 place-items-center rounded-full bg-gradient-brand text-white shadow-glow active:scale-95">
          {running ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          { k: "Today", v: `${todayMinutes}m` },
          { k: "Sessions", v: String(todayCount) },
          { k: "All time", v: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` },
        ].map((x) => (
          <div key={x.k} className="rounded-3xl bg-card px-3 py-2 shadow-soft">
            <p className="font-display text-sm font-bold">{x.v}</p>
            <p className="text-[10px] text-muted-foreground">{x.k}</p>
          </div>
        ))}
      </div>
      {sessions.length === 0 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">No study sessions yet — finish a timer to log your first one.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Flashcards() {
  const { data: cards = [], isLoading } = useFlashcards();
  const { data: classes = [] } = useClasses();
  const save = useSaveFlashcard();
  const del = useDeleteFlashcard();

  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState<{ id?: string; question: string; answer: string; class_id: string } | null>(null);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);

  const shown = filter ? cards.filter((c) => c.class_id === filter) : cards;
  const card: FlashcardRow | undefined = shown[Math.min(i, Math.max(0, shown.length - 1))];
  const valid = !!draft?.question.trim() && !!draft?.answer.trim();

  useEffect(() => { setI(0); setFlip(false); }, [filter, cards.length]);

  if (isLoading) return <Loading />;

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium"
        >
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.subject}</option>)}
        </select>
        <button
          onClick={() => setDraft({ question: "", answer: "", class_id: filter })}
          className="flex items-center gap-1.5 rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow active:scale-95"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty
          title="No flashcards yet."
          text="Create your first flashcard to start reviewing."
        />
      ) : (
        <>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-muted-foreground">
              {classes.find((c) => c.id === card?.class_id)?.subject ?? "Unassigned"}
            </span>
            <span className="font-medium">{Math.min(i + 1, shown.length)} / {shown.length}</span>
          </div>
          <button
            onClick={() => setFlip((f) => !f)}
            className="mt-3 grid min-h-[220px] w-full place-items-center rounded-3xl bg-gradient-brand p-8 text-center text-white shadow-glow"
          >
            <div>
              <Sparkles className="mx-auto size-5 opacity-70" />
              <p className="mt-3 font-display text-xl font-semibold leading-snug">
                {flip ? card?.answer : card?.question}
              </p>
              <p className="mt-4 text-xs opacity-70">Tap to flip</p>
            </div>
          </button>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => { setFlip(false); setI((n) => (n + 1) % shown.length); }}
              className="flex-1 rounded-3xl bg-card py-3 text-sm font-semibold shadow-soft active:scale-95"
            >
              Next card
            </button>
            {card && (
              <>
                <button
                  onClick={() => setDraft({ id: card.id, question: card.question, answer: card.answer, class_id: card.class_id ?? "" })}
                  aria-label="Edit flashcard"
                  className="grid size-11 place-items-center rounded-3xl bg-card shadow-soft active:scale-95"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => del.mutate(card.id)}
                  aria-label="Delete flashcard"
                  className="grid size-11 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-soft active:scale-95"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        </>
      )}

      {draft && (
        <Sheet title={draft.id ? "Edit flashcard" : "New flashcard"} onClose={() => setDraft(null)}>
          <Field label="Question">
            <textarea
              value={draft.question}
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
              rows={2}
              className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
            />
          </Field>
          <Field label="Answer">
            <textarea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
              rows={3}
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
          <button
            disabled={!valid || save.isPending}
            onClick={async () => {
              if (!draft) return;
              await save.mutateAsync({
                id: draft.id,
                question: draft.question.trim(),
                answer: draft.answer.trim(),
                class_id: draft.class_id || null,
              });
              setDraft(null);
            }}
            className="mt-2 w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : "Save flashcard"}
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Notes() {
  const { data: notes = [], isLoading } = useNotes();
  const { data: classes = [] } = useClasses();
  const save = useSaveNote();
  const del = useDeleteNote();
  const [draft, setDraft] = useState<{ id?: string; title: string; content: string; class_id: string } | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, NoteRow[]>();
    for (const n of notes) {
      const key = n.class_id ?? "";
      const list = map.get(key);
      if (list) list.push(n);
      else map.set(key, [n]);
    }
    return Array.from(map.entries());
  }, [notes]);

  const valid = !!draft?.title.trim();

  if (isLoading) return <Loading />;

  return (
    <div>
      <button
        onClick={() => setDraft({ title: "", content: "", class_id: "" })}
        className="flex w-full items-center justify-center gap-1.5 rounded-3xl bg-gradient-brand py-3 text-sm font-semibold text-white shadow-glow active:scale-95"
      >
        <Plus className="size-4" /> New note
      </button>

      {notes.length === 0 ? (
        <Empty title="No notes yet." text="Create a note and link it to one of your classes." />
      ) : (
        <div className="mt-4 space-y-4">
          {grouped.map(([classId, list]) => {
            const cls = classes.find((c) => c.id === classId);
            return (
              <div key={classId || "none"}>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: cls ? colorOf(cls.color) : "var(--muted-foreground)" }} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {cls?.subject ?? "Unassigned"} · {list.length}
                  </p>
                </div>
                <div className="mt-2 space-y-2">
                  {list.map((n) => (
                    <div key={n.id} className="rounded-3xl bg-card p-4 shadow-soft">
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold">{n.title}</p>
                          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{n.content}</p>
                        </div>
                        <button
                          onClick={() => setDraft({ id: n.id, title: n.title, content: n.content, class_id: n.class_id ?? "" })}
                          aria-label="Edit note"
                          className="grid size-9 shrink-0 place-items-center rounded-3xl bg-muted/60 active:scale-95"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => del.mutate(n.id)}
                          aria-label="Delete note"
                          className="grid size-9 shrink-0 place-items-center rounded-3xl bg-destructive/10 text-destructive active:scale-95"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {draft && (
        <Sheet title={draft.id ? "Edit note" : "New note"} onClose={() => setDraft(null)}>
          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
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
          <Field label="Content">
            <textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              rows={8}
              className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
            />
          </Field>
          <button
            disabled={!valid || save.isPending}
            onClick={async () => {
              if (!draft) return;
              await save.mutateAsync({
                id: draft.id,
                title: draft.title.trim(),
                content: draft.content,
                class_id: draft.class_id || null,
              });
              setDraft(null);
            }}
            className="mt-2 w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
          >
            {save.isPending ? "Saving…" : "Save note"}
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type Question = {
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
};

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ");
}

function AIQuiz() {
  const { data: classes = [] } = useClasses();
  const { data: notes = [] } = useNotes();
  const { data: cards = [] } = useFlashcards();

  const [classId, setClassId] = useState("");
  const [source, setSource] = useState<"notes" | "flashcards" | "both">("both");
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const scopedNotes = classId ? notes.filter((n) => n.class_id === classId) : notes;
  const scopedCards = classId ? cards.filter((c) => c.class_id === classId) : cards;
  const hasMaterial =
    (source !== "flashcards" && scopedNotes.length > 0) || (source !== "notes" && scopedCards.length > 0);

  async function generate() {
    const parts: string[] = [];
    if (source !== "flashcards") {
      for (const n of scopedNotes) parts.push(`Note: ${n.title}\n${n.content}`);
    }
    if (source !== "notes") {
      for (const c of scopedCards) parts.push(`Flashcard question: ${c.question}\nAnswer: ${c.answer}`);
    }
    const material = parts.join("\n\n");
    if (material.trim().length < 20) {
      toast.error("Add a bit more material before generating a quiz.");
      return;
    }

    setLoading(true);
    setQuestions(null);
    setSubmitted(false);
    setAnswers({});
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material,
          count,
          subject: classes.find((c) => c.id === classId)?.subject,
        }),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Couldn't generate the quiz"));
      const data = (await res.json()) as { questions?: Question[] };
      const list = (data.questions ?? []).filter((q) => q.question && q.answer);
      if (list.length === 0) throw new Error("The quiz came back empty — try again.");
      setQuestions(list.map((q) => ({ ...q, options: Array.isArray(q.options) ? q.options : [] })));
      toast.success(`Quiz ready — ${list.length} questions`);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't generate the quiz");
    } finally {
      setLoading(false);
    }
  }

  const correctCount = useMemo(() => {
    if (!questions) return 0;
    return questions.reduce((acc, q, idx) => {
      const given = answers[idx] ?? "";
      if (!given) return acc;
      if (q.type === "short_answer") {
        const a = normalize(q.answer);
        const g = normalize(given);
        return acc + (g === a || (g.length > 2 && a.includes(g)) || (a.length > 2 && g.includes(a)) ? 1 : 0);
      }
      return acc + (normalize(given) === normalize(q.answer) ? 1 : 0);
    }, 0);
  }, [questions, answers]);

  if (questions && submitted) {
    const total = questions.length;
    const pct = Math.round((correctCount / total) * 100);
    const feedback =
      pct >= 90 ? "Excellent work! You have a strong understanding of this topic."
        : pct >= 75 ? "Great job! A little more practice will help you master it."
        : pct >= 50 ? "Good effort. Review your notes and try again."
        : "Keep practicing! Review your notes and flashcards, then retake the quiz.";

    return (
      <div>
        <div className="rounded-3xl bg-gradient-brand p-6 text-center text-white shadow-glow">
          <p className="text-xs uppercase tracking-wider opacity-80">Your score</p>
          <p className="mt-1 font-display text-4xl font-bold">{correctCount}/{total}</p>
          <p className="mt-1 text-sm opacity-90">{pct}%</p>
          <p className="mt-3 text-sm leading-relaxed opacity-95">{feedback}</p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-card p-4 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-success">{correctCount}</p>
            <p className="text-[11px] text-muted-foreground">Correct</p>
          </div>
          <div className="rounded-3xl bg-card p-4 text-center shadow-soft">
            <p className="font-display text-xl font-bold text-destructive">{total - correctCount}</p>
            <p className="text-[11px] text-muted-foreground">Incorrect</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {questions.map((q, idx) => {
            const given = answers[idx] ?? "";
            const ok = q.type === "short_answer"
              ? normalize(given) === normalize(q.answer) || (normalize(given).length > 2 && normalize(q.answer).includes(normalize(given)))
              : normalize(given) === normalize(q.answer);
            return (
              <div key={idx} className="rounded-3xl bg-card p-4 shadow-soft">
                <p className="text-sm font-semibold">{idx + 1}. {q.question}</p>
                <p className={`mt-1.5 text-xs ${ok ? "text-success" : "text-destructive"}`}>
                  Your answer: {given || "—"}
                </p>
                {!ok && <p className="text-xs text-muted-foreground">Correct answer: {q.answer}</p>}
                {q.explanation && <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => { setSubmitted(false); setAnswers({}); }}
            className="rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow active:scale-95"
          >
            Retake quiz
          </button>
          <button
            onClick={() => { setQuestions(null); setSubmitted(false); setAnswers({}); }}
            className="rounded-3xl border border-border bg-card py-3.5 text-sm font-semibold active:scale-95"
          >
            New quiz
          </button>
        </div>
      </div>
    );
  }

  if (questions) {
    const answeredAll = questions.every((_, idx) => (answers[idx] ?? "").trim().length > 0);
    return (
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="rounded-3xl bg-card p-4 shadow-soft">
            <p className="text-sm font-semibold">{idx + 1}. {q.question}</p>
            {q.type === "short_answer" ? (
              <input
                value={answers[idx] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [idx]: e.target.value }))}
                placeholder="Your answer"
                className="mt-2 w-full rounded-3xl border border-border bg-background px-4 py-2.5 text-sm outline-none"
              />
            ) : (
              <div className="mt-2 space-y-1.5">
                {(q.options.length ? q.options : ["True", "False"]).map((opt) => {
                  const selected = answers[idx] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setAnswers((a) => ({ ...a, [idx]: opt }))}
                      className={`flex w-full items-center gap-2 rounded-3xl px-4 py-2.5 text-left text-sm transition ${
                        selected ? "bg-gradient-brand text-white" : "bg-muted/50"
                      }`}
                    >
                      <span className="flex-1">{opt}</span>
                      {selected && <Check className="size-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <button
          disabled={!answeredAll}
          onClick={() => setSubmitted(true)}
          className="w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
        >
          {answeredAll ? "Submit quiz" : "Answer every question to submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-card p-5 shadow-soft">
      <p className="font-display text-base font-bold">AI Quiz</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Generates questions from your own notes and flashcards — nothing else.
      </p>

      <Field label="Class">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="w-full rounded-3xl border border-border bg-background px-4 py-3 text-sm outline-none"
        >
          <option value="">All classes</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.subject}</option>)}
        </select>
      </Field>

      <Field label="Study material">
        <div className="grid grid-cols-3 gap-2">
          {(["notes", "flashcards", "both"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`rounded-3xl py-2.5 text-xs font-semibold capitalize transition ${
                source === s ? "bg-gradient-brand text-white shadow-glow" : "bg-muted/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Questions">
        <div className="grid grid-cols-4 gap-2">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`rounded-3xl py-2.5 text-xs font-semibold transition ${
                count === n ? "bg-gradient-brand text-white shadow-glow" : "bg-muted/50"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {!hasMaterial && (
        <p className="mt-2 text-xs text-muted-foreground">
          No study material yet — add notes or flashcards for this class first.
        </p>
      )}

      <button
        disabled={!hasMaterial || loading}
        onClick={generate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
      >
        {loading ? <><Loader2 className="size-4 animate-spin" /> Generating…</> : <><BrainCircuit className="size-4" /> Generate quiz</>}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Loading() {
  return (
    <div className="flex justify-center py-10">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="mt-4 rounded-3xl border border-dashed border-border p-6 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{text}</p>
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

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-bold">{title}</p>
          <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-3xl bg-muted/60">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
