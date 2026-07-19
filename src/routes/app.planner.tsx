import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Check, BookOpen, CalendarDays, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";


export const Route = createFileRoute("/app/planner")({
  component: Planner,
});

type Filter = "Today" | "Tomorrow" | "This Week" | "Overdue";
const filters: Filter[] = ["Today", "Tomorrow", "This Week", "Overdue"];

type Item = { id: number; subject: string; title: string; due: string; priority: "high" | "med" | "low"; done: boolean; bucket: Filter };

const initial: Item[] = [
  { id: 1, subject: "Chemistry", title: "Titration lab report", due: "Today 9pm", priority: "high", done: false, bucket: "Today" },
  { id: 2, subject: "Math", title: "Problem set 12 (odd)", due: "Today", priority: "med", done: false, bucket: "Today" },
  { id: 3, subject: "English", title: "Essay draft — Gatsby", due: "Tomorrow", priority: "med", done: false, bucket: "Tomorrow" },
  { id: 4, subject: "Biology", title: "Read Ch. 8", due: "Thu", priority: "low", done: true, bucket: "This Week" },
  { id: 5, subject: "History", title: "WWII timeline", due: "Fri", priority: "med", done: false, bucket: "This Week" },
  { id: 6, subject: "Physics", title: "Kinematics worksheet", due: "Yesterday", priority: "high", done: false, bucket: "Overdue" },
];

const priorityStyle = {
  high: "bg-destructive/10 text-destructive",
  med: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

function Planner() {
  const [filter, setFilter] = useState<Filter>("Today");
  const [items, setItems] = useState(initial);
  const { profile, reload } = useProfile();
  const [syncing, setSyncing] = useState(false);
  const connected = !!profile?.gcal_connected;

  async function toggleGcal() {
    if (!profile) return;
    setSyncing(true);
    // Simulated OAuth handshake — flip flag in DB.
    await new Promise((r) => setTimeout(r, connected ? 300 : 900));
    await supabase.from("profiles").update({ gcal_connected: !connected }).eq("id", profile.id);
    await reload();
    setSyncing(false);
  }

  const shown = items.filter((i) => i.bucket === filter);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Planner</h1>
          <p className="text-xs text-muted-foreground">Homework, exams & study sessions</p>
        </div>
        <button className="grid size-11 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow active:scale-95">
          <Plus className="size-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Google Calendar integration (mock) */}
      <div className={`mt-5 overflow-hidden rounded-3xl p-4 shadow-soft transition ${connected ? "bg-gradient-brand text-white shadow-glow" : "bg-card"}`}>
        <div className="flex items-center gap-3">
          <div className={`grid size-11 place-items-center rounded-2xl ${connected ? "bg-white/20 backdrop-blur" : "bg-accent"}`}>
            <GoogleCalIcon />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Google Calendar</p>
            <p className={`text-xs ${connected ? "opacity-80" : "text-muted-foreground"}`}>
              {connected ? "Synced · 6 events this week" : "Sync classes, reminders & exams"}
            </p>
          </div>
          <button
            onClick={toggleGcal}
            disabled={syncing}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-soft disabled:opacity-70 ${connected ? "bg-white/20 text-white" : "bg-foreground text-background"}`}
          >
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : connected ? "Connected" : "Connect"}
          </button>
        </div>
        {connected && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-semibold">
            {[
              { t: "9:00", s: "Biology" },
              { t: "11:00", s: "Calculus" },
              { t: "14:00", s: "History" },
            ].map((e) => (
              <div key={e.s} className="rounded-2xl bg-white/15 p-2 backdrop-blur">
                <p className="opacity-80">{e.t}</p>
                <p>{e.s}</p>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Mini month strip */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["Mon 18","Tue 19","Wed 20","Thu 21","Fri 22","Sat 23","Sun 24"].map((d, i) => {
          const active = i === 2;
          return (
            <button
              key={d}
              className={`flex min-w-[52px] flex-col items-center gap-0.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition ${
                active ? "bg-gradient-brand text-white shadow-glow" : "bg-card shadow-soft"
              }`}
            >
              <span className={active ? "opacity-80" : "text-muted-foreground"}>{d.split(" ")[0]}</span>
              <span className="font-display text-base font-bold">{d.split(" ")[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => {
          const active = f === filter;
          const count = items.filter((i) => i.bucket === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? "bg-foreground text-background" : "bg-card text-muted-foreground shadow-soft"
              }`}
            >
              {f}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-background/20" : "bg-muted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items */}
      <div className="mt-4 space-y-2.5">
        {shown.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-8 text-center">
            <CalendarDays className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">Nothing here!</p>
            <p className="text-xs text-muted-foreground">You're all caught up 🎉</p>
          </div>
        )}
        {shown.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
            <button
              onClick={() => setItems((s) => s.map((x) => x.id === i.id ? { ...x, done: !x.done } : x))}
              className={`grid size-9 shrink-0 place-items-center rounded-full border-2 transition ${
                i.done ? "border-primary bg-gradient-brand" : "border-border bg-background"
              }`}
            >
              {i.done && <Check className="size-4 text-white" strokeWidth={3} />}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${i.done ? "text-muted-foreground line-through" : ""}`}>{i.title}</p>
              <p className="text-xs text-muted-foreground">{i.subject} · {i.due}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyle[i.priority]}`}>
              {i.priority}
            </span>
          </div>
        ))}
      </div>

      {filter === "Overdue" && shown.length > 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-destructive/10 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs text-destructive">
            You have overdue work. Tap the AI button to auto-generate a catch-up plan.
          </p>
        </div>
      )}

      {/* Study sessions */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold">Scheduled study sessions</h2>
        <div className="mt-3 space-y-2.5">
          {[
            { time: "16:00 — 17:00", subject: "Calculus", color: "oklch(0.65 0.18 260)" },
            { time: "19:30 — 20:15", subject: "Chemistry", color: "oklch(0.7 0.15 155)" },
          ].map((s) => (
            <div key={s.subject} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
              <div className="h-10 w-1 rounded-full" style={{ background: s.color }} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{s.subject}</p>
                <p className="text-xs text-muted-foreground">{s.time}</p>
              </div>
              <BookOpen className="size-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
