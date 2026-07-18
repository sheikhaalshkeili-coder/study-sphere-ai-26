import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ScanLine, Timer, Layers, FileText, Play, Pause, RotateCcw,
  ChevronRight, Music2, Sparkles, GraduationCap, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/app/study")({
  component: Study,
});

const tools = [
  { id: "focus", icon: Timer, label: "Focus", desc: "Pomodoro & timers", tint: "oklch(0.65 0.18 200)" },
  { id: "flash", icon: Layers, label: "Flashcards", desc: "Swipe to learn", tint: "oklch(0.6 0.22 300)" },
  { id: "scan", icon: ScanLine, label: "Smart Scan", desc: "OCR & AI", tint: "oklch(0.6 0.2 275)" },
  { id: "notes", icon: FileText, label: "Notes", desc: "Organize by subject", tint: "oklch(0.65 0.18 250)" },
] as const;

function Study() {
  const [active, setActive] = useState<(typeof tools)[number]["id"]>("focus");

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
            <div className="grid size-10 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${t.tint} 22%, var(--card))` }}>
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
        {active === "scan" && <Scanner />}
        {active === "notes" && <Notes />}
      </div>

      {/* GPA + progress teaser */}
      <div className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft">
        <div className="grid size-11 place-items-center rounded-2xl bg-accent">
          <GraduationCap className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Current GPA</p>
          <p className="font-display text-lg font-bold">3.86 <span className="text-xs font-medium text-success">+0.12</span></p>
        </div>
        <TrendingUp className="size-4 text-success" />
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function Focus() {
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [music, setMusic] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [running]);

  const mm = Math.floor(secs / 60).toString().padStart(2, "0");
  const ss = (secs % 60).toString().padStart(2, "0");
  const pct = 1 - secs / (25 * 60);
  const C = 2 * Math.PI * 92;

  return (
    <div className="rounded-3xl bg-gradient-soft p-6">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pomodoro · Focus</p>
      <div className="relative mx-auto mt-4 grid size-56 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="92" strokeWidth="10" className="fill-none stroke-border" />
          <circle
            cx="100" cy="100" r="92" strokeWidth="10"
            className="fill-none stroke-primary"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
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

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={() => { setRunning(false); setSecs(25 * 60); }}
          className="grid size-12 place-items-center rounded-full bg-card shadow-soft active:scale-95"
        >
          <RotateCcw className="size-4" />
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          className="grid size-16 place-items-center rounded-full bg-gradient-brand text-white shadow-glow active:scale-95"
        >
          {running ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
        </button>
        <button
          onClick={() => setMusic((m) => !m)}
          className={`grid size-12 place-items-center rounded-full shadow-soft active:scale-95 ${
            music ? "bg-gradient-brand text-white" : "bg-card"
          }`}
        >
          <Music2 className="size-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[{k:"Sessions",v:"4"},{k:"Focus",v:"1h 45m"},{k:"XP",v:"+120"}].map(x => (
          <div key={x.k} className="rounded-2xl bg-card px-3 py-2 shadow-soft">
            <p className="font-display text-sm font-bold">{x.v}</p>
            <p className="text-[10px] text-muted-foreground">{x.k}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Flashcards() {
  const cards = [
    { q: "What is the mitochondria's primary function?", a: "Produce ATP through cellular respiration — the cell's powerhouse." },
    { q: "Define derivative in calculus", a: "The instantaneous rate of change of a function at a point." },
    { q: "Year WWII ended?", a: "1945" },
  ];
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const c = cards[i];

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Biology · Cell Bio</p>
        <p className="text-xs font-medium">{i + 1} / {cards.length}</p>
      </div>
      <button
        onClick={() => setFlip((f) => !f)}
        className="mt-3 grid min-h-[240px] w-full place-items-center rounded-3xl bg-gradient-brand p-8 text-center text-white shadow-glow"
      >
        <div>
          <Sparkles className="mx-auto size-5 opacity-70" />
          <p className="mt-3 font-display text-xl font-semibold leading-snug">
            {flip ? c.a : c.q}
          </p>
          <p className="mt-4 text-xs opacity-70">Tap to flip</p>
        </div>
      </button>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => { setFlip(false); setI((n) => (n + 1) % cards.length); }}
          className="rounded-2xl bg-destructive/10 py-3 text-sm font-semibold text-destructive active:scale-95"
        >
          Difficult
        </button>
        <button
          onClick={() => { setFlip(false); setI((n) => (n + 1) % cards.length); }}
          className="rounded-2xl bg-success/15 py-3 text-sm font-semibold text-success active:scale-95"
        >
          Easy
        </button>
      </div>
    </div>
  );
}

function Scanner() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-foreground/90 p-8 text-center">
        <div className="mx-auto grid size-24 place-items-center rounded-3xl border-2 border-dashed border-white/40 bg-white/5">
          <ScanLine className="size-10 text-white" />
        </div>
        <p className="mt-4 font-display text-lg font-bold text-white">Point & capture</p>
        <p className="mt-1 text-xs text-white/70">Scan worksheets, textbooks, handwritten notes or whiteboards</p>
        <button className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-foreground active:scale-95">
          Open camera
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {["Summarize", "Generate flashcards", "Create quiz", "Save as notes"].map((x) => (
          <button key={x} className="rounded-2xl bg-card p-3.5 text-left shadow-soft active:scale-95">
            <p className="text-sm font-semibold">{x}</p>
            <p className="text-[11px] text-muted-foreground">AI powered</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function Notes() {
  const folders = [
    { name: "Biology", count: 14, tint: "oklch(0.7 0.15 155)" },
    { name: "Calculus", count: 9, tint: "oklch(0.65 0.18 260)" },
    { name: "History", count: 7, tint: "oklch(0.68 0.19 40)" },
    { name: "English", count: 5, tint: "oklch(0.6 0.22 320)" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {folders.map((f) => (
          <div key={f.name} className="rounded-3xl bg-card p-4 shadow-soft">
            <div className="size-9 rounded-2xl" style={{ background: `color-mix(in oklab, ${f.tint} 25%, transparent)` }} />
            <p className="mt-3 font-display text-sm font-bold">{f.name}</p>
            <p className="text-[11px] text-muted-foreground">{f.count} notes</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-3xl bg-card p-4 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent</p>
        <div className="mt-2 space-y-2">
          {["Cell respiration recap", "Derivatives cheat sheet", "WWII causes outline"].map((n) => (
            <div key={n} className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2.5">
              <p className="text-sm font-medium">{n}</p>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
