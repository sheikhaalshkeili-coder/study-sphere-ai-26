import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Baby, BookOpen, Check, ClipboardPaste, FileText, HelpCircle, Lightbulb, Loader2, Mic, Paperclip,
  Pause, Play, Send, Sparkles, Square, Trophy, Volume2, X, Youtube, Wand2, ListChecks, Search, ScrollText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, type ClassRow } from "@/hooks/use-study-data";
import { useVoice } from "@/hooks/use-voice";
import { ACCEPT, OFF_TOPIC, learnApi, readMaterialFile, type Material } from "@/lib/learn-client";

export const Route = createFileRoute("/app/learn")({
  head: () => ({
    meta: [
      { title: "Learn — StudySphere" },
      { name: "description", content: "Learn any topic from your own courses and materials, step by step, with quick checks and quizzes." },
      { property: "og:title", content: "Learn — StudySphere" },
      { property: "og:description", content: "Learn any topic from your own courses and materials, step by step, with quick checks and quizzes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LearnPage,
});

/* ---------- types ---------- */
type CheckQ = { question: string; options: string[]; answer_index: number; explanation: string; reteach: string };
type Step = {
  title: string; concept: string; explanation: string;
  done?: boolean; variants?: { mode: string; text: string }[]; qa?: { q: string; a: string }[]; struggles?: number;
};
type Session = {
  id: string; class_id: string | null; course_id: string | null; course_name: string; topic: string; lesson_title: string;
  materials: Material[]; steps: Step[]; current_step: number; completed_steps: number; total_steps: number;
  questions_answered: number; questions_correct: number; review_concepts: string[]; completed_at: string | null; updated_at: string;
};

const db = supabase as unknown as { from: (t: string) => any };

function useLearnSessions() {
  return useQuery({
    queryKey: ["learn-sessions"],
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await db.from("learn_sessions").select("*").order("updated_at", { ascending: false }).limit(30);
      if (error) throw error;
      return (data ?? []) as Session[];
    },
  });
}

async function patchSession(id: string, patch: Partial<Session>) {
  const { error } = await db.from("learn_sessions").update(patch).eq("id", id);
  if (error) toast.error("Couldn't save your progress");
}

const MODE_LABEL: Record<string, string> = { eli5: "Like I'm 5", simpler: "Simpler", detail: "More detail", example: "Example", different: "New approach" };

/* ---------- page ---------- */
function LearnPage() {
  const { data: classes = [], isLoading } = useClasses();
  const courses = classes.filter((c) => c.course_id);
  const { data: sessions = [] } = useLearnSessions();
  const qc = useQueryClient();
  const [active, setActive] = useState<Session | null>(null);

  if (active)
    return <LessonView session={active} onChange={setActive} onExit={() => { setActive(null); qc.invalidateQueries({ queryKey: ["learn-sessions"] }); }} />;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Learn</h1>
          <p className="text-xs text-muted-foreground">Your AI tutor, textbook and study coach</p>
        </div>
        <Link to="/app/leaderboard" className="flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-semibold shadow-soft">
          <Trophy className="size-4 text-primary" /> Leaderboard
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : courses.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
          <BookOpen className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">Choose your courses first</p>
          <p className="text-xs text-muted-foreground">Learn works with the official courses you take. Pick them, then come back.</p>
          <Link to="/app/classes" className="mt-4 inline-block rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-primary-foreground shadow-glow">Choose my courses</Link>
        </div>
      ) : (
        <Setup courses={courses} onStart={setActive} />
      )}

      <h2 className="mt-8 font-display text-base font-bold">Recently studied</h2>
      {sessions.length === 0 ? (
        <p className="mt-2 rounded-3xl bg-card p-5 text-center text-sm text-muted-foreground shadow-soft">You haven't started a Learn session yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {sessions.map((s) => (
            <button key={s.id} onClick={() => setActive(s)} className="w-full rounded-3xl bg-card p-4 text-left shadow-soft active:scale-[0.99]">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{s.course_name} — {s.lesson_title || s.topic}</p>
                {s.completed_at && <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-primary">Done</span>}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${s.total_steps ? (s.completed_steps / s.total_steps) * 100 : 0}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {s.completed_steps}/{s.total_steps} steps · {s.questions_answered ? `${Math.round((s.questions_correct / s.questions_answered) * 100)}% correct` : "no questions yet"}
                {s.review_concepts.length ? ` · review: ${s.review_concepts.slice(0, 2).join(", ")}` : ""} · {new Date(s.updated_at).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- setup ---------- */
function Setup({ courses, onStart }: { courses: ClassRow[]; onStart: (s: Session) => void }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [panel, setPanel] = useState<"paste" | "youtube" | null>(null);
  const [paste, setPaste] = useState("");
  const [yt, setYt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [warn, setWarn] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const course = courses.find((c) => c.id === courseId);

  async function onFiles(files: FileList | null) {
    for (const f of Array.from(files ?? [])) {
      setBusy(`Reading ${f.name}…`);
      try { const m = await readMaterialFile(f); setMaterials((x) => [...x, m]); toast.success(`${f.name} added`); }
      catch (e) { toast.error((e as Error).message); }
    }
    setBusy(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function addYoutube() {
    setBusy("Getting the video transcript…");
    try {
      const r = await learnApi<{ title: string; text: string }>("youtube", { url: yt.trim() });
      setMaterials((x) => [...x, { kind: "youtube", name: r.title, text: r.text }]);
      setYt(""); setPanel(null); toast.success("Video transcript added");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  const start = useMutation({
    mutationFn: async () => {
      if (!course) throw new Error("Choose a course");
      const material = materials.map((m) => `[${m.name}]\n${m.text}`).join("\n\n").slice(0, 30000);
      const plan = await learnApi<{ on_topic: boolean; lesson_title: string; steps: Step[] }>("plan", { course: course.subject, topic, material });
      if (!plan.on_topic || !plan.steps?.length) return null;
      const { data: u } = await supabase.auth.getUser();
      const row = {
        user_id: u.user!.id, class_id: course.id, course_id: course.course_id, course_name: course.subject, topic: topic.trim(),
        lesson_title: plan.lesson_title, materials: materials.map((m) => ({ ...m, text: m.text.slice(0, 15000) })),
        steps: plan.steps.slice(0, 8), total_steps: Math.min(plan.steps.length, 8),
      };
      const { data, error } = await db.from("learn_sessions").insert(row).select("*").single();
      if (error) throw error;
      return data as Session;
    },
    onSuccess: (s) => { if (!s) setWarn(OFF_TOPIC); else onStart(s); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-5 rounded-3xl bg-card p-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Course</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {courses.map((c) => (
          <button key={c.id} onClick={() => setCourseId(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${c.id === courseId ? "border-primary bg-accent text-primary" : "border-border"}`}>
            {c.subject}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-3xl border border-border bg-background px-4 py-3 focus-within:border-primary">
        <Search className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <textarea value={topic} onChange={(e) => { setTopic(e.target.value); setWarn(null); }} rows={2} maxLength={300}
          placeholder="I want to study…" className="w-full resize-none bg-transparent text-base outline-none" />
      </div>

      <div className="mt-3 flex gap-2">
        <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => onFiles(e.target.files)} />
        <ToolBtn icon={Paperclip} label="Upload" onClick={() => fileRef.current?.click()} />
        <ToolBtn icon={ClipboardPaste} label="Paste" active={panel === "paste"} onClick={() => setPanel(panel === "paste" ? null : "paste")} />
        <ToolBtn icon={Youtube} label="YouTube" active={panel === "youtube"} onClick={() => setPanel(panel === "youtube" ? null : "youtube")} />
      </div>

      {panel === "paste" && (
        <div className="mt-3">
          <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={6} placeholder="Paste class notes, a textbook section, review sheet or questions…"
            className="w-full rounded-3xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
          <button disabled={paste.trim().length < 20} onClick={() => {
            setMaterials((x) => [...x, { kind: "paste", name: `Pasted text (${paste.trim().split(/\s+/).length} words)`, text: paste.trim() }]);
            setPaste(""); setPanel(null);
          }} className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Add pasted text</button>
        </div>
      )}
      {panel === "youtube" && (
        <div className="mt-3 flex gap-2">
          <input value={yt} onChange={(e) => setYt(e.target.value)} placeholder="https://youtube.com/watch?v=…"
            className="w-full rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary" />
          <button disabled={!yt.trim() || !!busy} onClick={addYoutube} className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">Add</button>
        </div>
      )}

      {busy && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />{busy}</p>}

      <div className="mt-3 space-y-1.5">
        {materials.length === 0 ? (
          <p className="text-xs text-muted-foreground">No study materials added yet.</p>
        ) : materials.map((m, i) => (
          <div key={i} className="flex items-center gap-2 rounded-2xl bg-accent px-3 py-2 text-xs">
            {m.kind === "youtube" ? <Youtube className="size-4 text-primary" /> : m.kind === "paste" ? <ClipboardPaste className="size-4 text-primary" /> : <FileText className="size-4 text-primary" />}
            <span className="flex-1 truncate font-semibold">{m.name}</span>
            <span className="text-muted-foreground">{Math.max(1, Math.round(m.text.split(/\s+/).length / 100) / 10)}k words</span>
            <button aria-label={`Remove ${m.name}`} onClick={() => setMaterials((x) => x.filter((_, j) => j !== i))}><X className="size-3.5" /></button>
          </div>
        ))}
      </div>

      {warn && <p className="mt-3 rounded-2xl bg-accent p-3 text-xs">{warn}</p>}

      <button disabled={!course || topic.trim().length < 2 || start.isPending || !!busy} onClick={() => start.mutate()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
        {start.isPending ? <><Loader2 className="size-4 animate-spin" />Building your lesson…</> : <><Sparkles className="size-4" />Learn</>}
      </button>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick, active }: { icon: typeof Paperclip; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2 text-xs font-semibold transition ${active ? "border-primary bg-accent text-primary" : "border-border"}`}>
      <Icon className="size-4" />{label}
    </button>
  );
}

/* ---------- read aloud ---------- */
function useReadAloud() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  useEffect(() => () => { audio.current?.pause(); }, []);
  async function play(text: string) {
    stop(); setState("loading");
    try {
      const r = await fetch("/api/voice/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!r.ok) throw new Error(await r.text());
      const a = new Audio(URL.createObjectURL(await r.blob()));
      a.onended = () => setState("idle");
      audio.current = a; await a.play(); setState("playing");
    } catch { setState("idle"); toast.error("Couldn't read this aloud right now"); }
  }
  function pause() { audio.current?.pause(); setState("paused"); }
  function resume() { audio.current?.play(); setState("playing"); }
  function stop() { audio.current?.pause(); audio.current = null; setState("idle"); }
  return { state, play, pause, resume, stop };
}

/* ---------- lesson ---------- */
function LessonView({ session, onChange, onExit }: { session: Session; onChange: (s: Session) => void; onExit: () => void }) {
  const s = session;
  const idx = Math.min(s.current_step, s.steps.length - 1);
  const step = s.steps[idx];
  const [view, setView] = useState<string>("main");
  const [phase, setPhase] = useState<"learn" | "help" | "check">("learn");
  const [busy, setBusy] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckQ[] | null>(null);
  const [picked, setPicked] = useState<(number | null)[]>([]);
  const [solved, setSolved] = useState<boolean[]>([]);
  const [question, setQuestion] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const read = useReadAloud();
  const voice = useVoice();
  const material = useMemo(() => s.materials.map((m) => `[${m.name}]\n${m.text}`).join("\n\n"), [s.materials]);
  const outline = s.steps.map((x, i) => `${i + 1}. ${x.title} — ${x.concept}`).join("\n");
  const ctx = { course: s.course_name, topic: s.topic, material, lesson: outline, step: `${step.title}\n${step.explanation}`, history: step.qa ?? [] };
  const allDone = s.completed_steps >= s.total_steps;

  useEffect(() => { setView("main"); setPhase("learn"); setCheck(null); read.stop(); }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(patch: Partial<Session>, stepPatch?: Partial<Step>) {
    const steps = stepPatch ? s.steps.map((x, i) => (i === idx ? { ...x, ...stepPatch } : x)) : s.steps;
    const next = { ...s, ...patch, steps };
    onChange(next);
    patchSession(s.id, { ...patch, ...(stepPatch ? { steps } : {}) });
    return next;
  }

  const shownText = view === "main" ? step.explanation : step.variants?.find((v) => v.mode === view)?.text ?? step.explanation;

  async function explain(mode: string) {
    const have = step.variants?.find((v) => v.mode === mode);
    if (have && mode !== "different") { setView(mode); setPhase("learn"); return; }
    setBusy(MODE_LABEL[mode]);
    try {
      const r = await learnApi<{ on_topic: boolean; text: string }>("explain", { ...ctx, mode });
      update({}, { variants: [...(step.variants ?? []).filter((v) => v.mode !== mode), { mode, text: r.text }] });
      setView(mode); setPhase("learn");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function ask(q: string) {
    if (!q.trim()) return;
    setBusy("Thinking…");
    try {
      const r = await learnApi<{ on_topic: boolean; text: string }>("ask", { ...ctx, question: q });
      update({}, { qa: [...(step.qa ?? []), { q, a: r.on_topic ? r.text : OFF_TOPIC }] });
      setQuestion("");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  async function startCheck(retry = false) {
    setBusy("Preparing your quick check…");
    try {
      const r = await learnApi<{ questions: CheckQ[] }>("check", { ...ctx, retry });
      const qs = r.questions.slice(0, 3);
      setCheck(qs); setPicked(qs.map(() => null)); setSolved(qs.map(() => false)); setPhase("check");
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  function answer(qi: number, oi: number) {
    if (!check || solved[qi] || picked[qi] !== null) return;
    const ok = check[qi].answer_index === oi;
    setPicked((p) => p.map((v, i) => (i === qi ? oi : v)));
    if (ok) setSolved((p) => p.map((v, i) => (i === qi ? true : v)));
    const struggles = (step.struggles ?? 0) + (ok ? 0 : 1);
    const review = !ok && struggles >= 2 && !s.review_concepts.includes(step.concept) ? [...s.review_concepts, step.concept] : s.review_concepts;
    update({ questions_answered: s.questions_answered + 1, questions_correct: s.questions_correct + (ok ? 1 : 0), review_concepts: review }, ok ? undefined : { struggles });
  }

  async function slowDown() {
    await explain("different");
    await startCheck(true);
  }

  function completeStep() {
    const completed = s.completed_steps + 1;
    const last = idx >= s.steps.length - 1;
    update({ completed_steps: completed, current_step: last ? idx : idx + 1, completed_at: completed >= s.total_steps ? new Date().toISOString() : null }, { done: true });
    toast.success(last ? "Lesson complete — great work!" : "Step complete");
  }

  const struggling = (step.struggles ?? 0) >= 3;
  const allSolved = check && solved.every(Boolean);

  return (
    <div className="px-5 pt-6 pb-8">
      <div className="flex items-center gap-2">
        <button onClick={onExit} aria-label="Back" className="grid size-9 place-items-center rounded-3xl bg-card shadow-soft"><ArrowLeft className="size-4" /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-primary">{s.course_name}</p>
          <h1 className="truncate font-display text-lg font-bold">{s.lesson_title || s.topic}</h1>
        </div>
        <button onClick={() => setQuizOpen(true)} className="flex items-center gap-1 rounded-full bg-card px-3 py-2 text-xs font-semibold shadow-soft"><ListChecks className="size-4 text-primary" />Make a Quiz</button>
      </div>

      {/* progress */}
      <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
        <div className="flex justify-between text-xs font-semibold"><span>Progress: {s.completed_steps} / {s.total_steps} steps</span>
          <span className="text-muted-foreground">{s.questions_answered ? `${Math.round((s.questions_correct / s.questions_answered) * 100)}% correct` : ""}</span></div>
        <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${(s.completed_steps / Math.max(1, s.total_steps)) * 100}%` }} /></div>
        <ul className="mt-3 space-y-1 text-xs">
          {s.steps.map((x, i) => (
            <li key={i} className={`flex items-center gap-2 ${i === idx ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              {x.done ? <Check className="size-3.5 text-primary" /> : <span className="grid size-3.5 place-items-center"><span className="size-2 rounded-full border border-current" /></span>}{x.title}
            </li>
          ))}
        </ul>
        {s.review_concepts.length > 0 && <p className="mt-2 text-[11px] text-muted-foreground">Needs review: {s.review_concepts.join(", ")}</p>}
      </div>

      {/* step */}
      <div className="mt-4 rounded-3xl bg-card p-5 shadow-soft animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Step {idx + 1}{view !== "main" ? ` · ${MODE_LABEL[view]}` : ""}</p>
            <h2 className="mt-1 font-display text-lg font-bold">{step.title}</h2>
          </div>
          <div className="flex shrink-0 gap-1">
            {read.state === "idle" && <IconBtn label="Listen" icon={Volume2} onClick={() => read.play(`${step.title}. ${shownText}`)} />}
            {read.state === "loading" && <IconBtn label="Loading audio" icon={Loader2} spin onClick={() => {}} />}
            {read.state === "playing" && <IconBtn label="Pause" icon={Pause} onClick={read.pause} active />}
            {read.state === "paused" && <IconBtn label="Resume" icon={Play} onClick={read.resume} active />}
            {(read.state === "playing" || read.state === "paused") && <IconBtn label="Stop" icon={Square} onClick={read.stop} />}
          </div>
        </div>
        {read.state === "playing" && <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-primary"><span className="size-2 animate-pulse rounded-full bg-primary" />Reading aloud…</p>}
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{shownText}</p>
        {(step.variants?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[{ mode: "main" }, ...(step.variants ?? [])].map((v) => (
              <button key={v.mode} onClick={() => setView(v.mode)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${view === v.mode ? "bg-primary text-primary-foreground" : "bg-accent"}`}>
                {v.mode === "main" ? "Original" : MODE_LABEL[v.mode]}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Ctl icon={Baby} label="Explain Like I'm 5" onClick={() => explain("eli5")} />
          <Ctl icon={Wand2} label="Simpler" onClick={() => explain("simpler")} />
          <Ctl icon={ScrollText} label="More Detail" onClick={() => explain("detail")} />
          <Ctl icon={Lightbulb} label="Give Me an Example" onClick={() => explain("example")} />
          <div className="col-span-2"><Ctl icon={HelpCircle} label="I Still Don't Understand" onClick={() => explain("different")} /></div>
        </div>

        {/* questions */}
        {(step.qa ?? []).map((x, i) => (
          <div key={i} className="mt-3 space-y-1.5 text-sm">
            <p className="ml-auto w-fit max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-primary-foreground">{x.q}</p>
            <p className="w-fit max-w-[90%] rounded-2xl bg-accent px-3 py-2">{x.a}</p>
          </div>
        ))}
        <div className="mt-3 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask(question)} maxLength={1500}
            placeholder="Ask a question about this step…" className="w-full bg-transparent text-sm outline-none" />
          <button aria-label={voice.state === "listening" ? "Stop and ask" : "Ask by voice"} onClick={async () => {
            if (voice.state === "listening") { const t = await voice.stopListening(); if (t) ask(t); } else voice.startListening();
          }} className={`grid size-8 shrink-0 place-items-center rounded-full ${voice.state === "listening" ? "animate-pulse bg-destructive text-destructive-foreground" : "bg-accent text-primary"}`}>
            {voice.state === "transcribing" ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
          </button>
          <button aria-label="Send question" disabled={!question.trim()} onClick={() => ask(question)} className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"><Send className="size-4" /></button>
        </div>
        {voice.state === "listening" && <p className="mt-1 text-[11px] font-semibold text-destructive">Listening… tap the mic again when you're done.</p>}
        {voice.error && <p className="mt-1 text-[11px] text-destructive">{voice.error}</p>}

        {busy && <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3.5 animate-spin" />{busy}</p>}
      </div>

      {/* understanding gate */}
      {!step.done && phase !== "check" && (
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <p className="text-sm font-semibold">Have you understood this step?</p>
          <div className="mt-3 flex gap-2">
            <button disabled={!!busy} onClick={() => startCheck()} className="flex flex-1 items-center justify-center gap-1 rounded-full bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">I understand <ArrowRight className="size-4" /></button>
            <button onClick={() => setPhase("help")} className="flex-1 rounded-full border border-border py-3 text-sm font-semibold">I need more help</button>
          </div>
          {phase === "help" && <p className="mt-3 text-xs text-muted-foreground">Try “Explain Like I'm 5”, “Simpler”, “More Detail”, “Give Me an Example”, or ask your own question above. Then tap I understand.</p>}
        </div>
      )}

      {/* quick check */}
      {phase === "check" && check && !step.done && (
        <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
          <p className="font-display text-base font-bold">Quick Check</p>
          <p className="text-xs text-muted-foreground">Answer all 3 correctly to finish this step.</p>
          {check.map((q, qi) => {
            const p = picked[qi];
            const wrong = p !== null && p !== q.answer_index;
            return (
              <div key={qi} className="mt-4">
                <p className="text-sm font-semibold">{qi + 1}. {q.question}</p>
                <div className="mt-2 space-y-1.5">
                  {q.options.map((o, oi) => {
                    const state = p === oi ? (oi === q.answer_index ? "right" : "wrong") : solved[qi] && oi === q.answer_index ? "right" : "";
                    return (
                      <button key={oi} onClick={() => answer(qi, oi)} disabled={solved[qi] || p !== null}
                        className={`w-full rounded-2xl border px-3 py-2 text-left text-sm transition ${state === "right" ? "border-primary bg-accent" : state === "wrong" ? "border-destructive bg-destructive/10" : "border-border"}`}>
                        {String.fromCharCode(65 + oi)}. {o}
                      </button>
                    );
                  })}
                </div>
                {solved[qi] && <p className="mt-2 text-xs"><b className="text-primary">Correct.</b> {q.explanation}</p>}
                {wrong && (
                  <div className="mt-2 rounded-2xl bg-destructive/10 p-3 text-xs">
                    <p><b>Not quite.</b> {q.reteach}</p>
                    <button onClick={() => setPicked((x) => x.map((v, i) => (i === qi ? null : v)))} className="mt-2 rounded-full bg-card px-3 py-1 font-semibold">Try again</button>
                  </div>
                )}
              </div>
            );
          })}
          {struggling && !allSolved && (
            <div className="mt-4 rounded-2xl bg-accent p-3 text-xs">
              <p className="font-semibold">Let's slow down.</p>
              <p className="mt-1 text-muted-foreground">This idea is tricky. I'll explain it a different way and give you new, easier questions.</p>
              <button disabled={!!busy} onClick={slowDown} className="mt-2 rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground">Explain it differently</button>
            </div>
          )}
          {allSolved && (
            <button onClick={completeStep} className="mt-4 flex w-full items-center justify-center gap-1 rounded-full bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground shadow-glow">
              {idx >= s.steps.length - 1 ? "Finish lesson" : "Continue"} <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      )}

      {step.done && !allDone && idx < s.steps.length - 1 && (
        <button onClick={() => update({ current_step: idx + 1 })} className="mt-4 w-full rounded-full bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground">Next step</button>
      )}
      {allDone && (
        <div className="mt-4 rounded-3xl bg-gradient-brand p-5 text-primary-foreground shadow-glow">
          <p className="font-display text-lg font-bold">Lesson complete</p>
          <p className="mt-1 text-sm opacity-90">{s.questions_correct}/{s.questions_answered} answers correct. Test yourself with a quiz next.</p>
          <button onClick={() => setQuizOpen(true)} className="mt-3 rounded-full bg-card px-4 py-2 text-xs font-semibold text-foreground">Make a Quiz</button>
        </div>
      )}

      {quizOpen && <QuizSheet ctx={{ course: s.course_name, topic: s.topic, material, lesson: outline }} onClose={() => setQuizOpen(false)}
        onAnswered={(ok) => update({ questions_answered: (session.questions_answered += 1), questions_correct: (session.questions_correct += ok ? 1 : 0) })} />}
    </div>
  );
}

function IconBtn({ icon: Icon, label, onClick, active, spin }: { icon: typeof Play; label: string; onClick: () => void; active?: boolean; spin?: boolean }) {
  return <button aria-label={label} title={label} onClick={onClick} className={`grid size-9 place-items-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-accent text-primary"}`}><Icon className={`size-4 ${spin ? "animate-spin" : ""}`} /></button>;
}
function Ctl({ icon: Icon, label, onClick }: { icon: typeof Play; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-accent px-2 py-2.5 text-xs font-semibold active:scale-[0.98]"><Icon className="size-4 text-primary" />{label}</button>;
}

/* ---------- quiz ---------- */
type QuizQ = { level: number; type: "mcq" | "written"; question: string; options: string[]; answer_index: number; model_answer: string; explanation: string };
const KINDS = [
  { id: "stepwise", label: "Step-by-Step Quiz", desc: "Starts easy, gets harder" },
  { id: "mcq", label: "Multiple Choice", desc: "Only multiple-choice" },
  { id: "written", label: "Written Questions", desc: "Short written answers" },
  { id: "full", label: "Full Test", desc: "A mix of both" },
  { id: "like_test", label: "Practice Like My Test", desc: "Original questions in your test's style" },
];

function QuizSheet({ ctx, onClose, onAnswered }: { ctx: Record<string, unknown>; onClose: () => void; onAnswered: (ok: boolean) => void }) {
  const [kind, setKind] = useState<string | null>(null);
  const [sample, setSample] = useState("");
  const [pool, setPool] = useState<QuizQ[]>([]);
  const [cur, setCur] = useState<QuizQ | null>(null);
  const [target, setTarget] = useState(1);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [written, setWritten] = useState("");
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [msg, setMsg] = useState<string | null>(null);

  function pick(from: QuizQ[], lvl: number) {
    if (!from.length) return null;
    return [...from].sort((a, b) => Math.abs(a.level - lvl) - Math.abs(b.level - lvl) || a.level - b.level)[0];
  }

  async function generate(k: string) {
    setKind(k); setBusy(true); setMsg(null);
    try {
      const r = await learnApi<{ on_topic: boolean; questions: QuizQ[] }>("quiz", { ...ctx, kind: k, sample });
      if (!r.on_topic || !r.questions.length) { setMsg(OFF_TOPIC); setKind(null); }
      else { const first = pick(r.questions, 1)!; setPool(r.questions.filter((q) => q !== first)); setCur(first); setTarget(first.level); }
    } catch (e) { toast.error((e as Error).message); setKind(null); }
    setBusy(false);
  }

  async function submit(choice?: number) {
    if (!cur) return;
    let ok = false; let text = cur.explanation;
    if (cur.type === "mcq") ok = choice === cur.answer_index;
    else {
      setBusy(true);
      try {
        const g = await learnApi<{ correct: boolean; feedback: string }>("grade", { ...ctx, question: cur.question, model_answer: cur.model_answer, answer: written });
        ok = g.correct; text = `${g.feedback} Model answer: ${cur.model_answer}`;
      } catch (e) { toast.error((e as Error).message); setBusy(false); return; }
      setBusy(false);
    }
    setResult({ ok, text }); setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 })); onAnswered(ok);
  }

  function next() {
    const lvl = Math.max(1, Math.min(4, target + (result?.ok ? 1 : -1)));
    const n = pick(pool, lvl);
    setTarget(lvl); setPool((p) => p.filter((q) => q !== n)); setCur(n); setResult(null); setWritten("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm">
      <button className="absolute inset-0" aria-label="Close quiz" onClick={onClose} />
      <div className="relative max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-background p-5 pb-8">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted" />
        <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Make a Quiz</h2>
          {score.total > 0 && <span className="text-xs font-semibold text-primary">{score.right}/{score.total} correct</span>}</div>

        {!kind && (
          <div className="mt-4 space-y-2">
            {KINDS.map((k) => (
              <div key={k.id}>
                <button disabled={k.id === "like_test" && sample.trim().length < 10} onClick={() => generate(k.id)}
                  className="w-full rounded-3xl bg-card p-3.5 text-left shadow-soft disabled:opacity-60">
                  <p className="text-sm font-semibold">{k.label}</p><p className="text-xs text-muted-foreground">{k.desc}</p>
                </button>
                {k.id === "like_test" && (
                  <textarea value={sample} onChange={(e) => setSample(e.target.value)} rows={3} placeholder="Paste a sample question or describe your test format…"
                    className="mt-2 w-full rounded-3xl border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
                )}
              </div>
            ))}
            {msg && <p className="rounded-2xl bg-accent p-3 text-xs">{msg}</p>}
          </div>
        )}

        {busy && !cur && <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Writing your questions…</p>}

        {cur && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Level {cur.level} · {["", "Recognition", "Understanding", "Application", "Written response"][cur.level] ?? ""}</p>
            <p className="mt-1 text-sm font-semibold">{cur.question}</p>
            {cur.type === "mcq" ? (
              <div className="mt-3 space-y-1.5">
                {cur.options.map((o, i) => (
                  <button key={i} disabled={!!result} onClick={() => submit(i)}
                    className={`w-full rounded-2xl border px-3 py-2 text-left text-sm ${result && i === cur.answer_index ? "border-primary bg-accent" : "border-border"}`}>{String.fromCharCode(65 + i)}. {o}</button>
                ))}
              </div>
            ) : (
              <>
                <textarea value={written} onChange={(e) => setWritten(e.target.value)} disabled={!!result} rows={4} placeholder="Explain in your own words…"
                  className="mt-3 w-full rounded-3xl border border-border bg-card p-3 text-sm outline-none focus:border-primary" />
                {!result && <button disabled={written.trim().length < 3 || busy} onClick={() => submit()} className="mt-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Checking…" : "Check my answer"}</button>}
              </>
            )}
            {result && (
              <div className={`mt-3 rounded-2xl p-3 text-xs ${result.ok ? "bg-accent" : "bg-destructive/10"}`}>
                <p><b>{result.ok ? "Correct." : "Not quite."}</b> {result.text}</p>
                <button onClick={next} className="mt-2 rounded-full bg-card px-3 py-1 font-semibold">{pool.length ? "Next question" : "Finish"}</button>
              </div>
            )}
          </div>
        )}
        {kind && !cur && !busy && (
          <div className="mt-6 text-center">
            <p className="font-display text-lg font-bold">Quiz finished</p>
            <p className="text-sm text-muted-foreground">{score.right} of {score.total} correct</p>
            <button onClick={() => { setKind(null); setScore({ right: 0, total: 0 }); }} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground">New quiz</button>
          </div>
        )}
      </div>
    </div>
  );
}
