import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles, Brain, BookOpen, Timer, ScanLine, CalendarDays,
  Flame, GraduationCap, Clock, ChevronRight, Bell, Trophy,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});


const today = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric",
});

const classes = [
  { time: "9:00", subject: "Biology", room: "Lab 2", color: "oklch(0.7 0.15 155)" },
  { time: "11:00", subject: "Calculus", room: "Room 204", color: "oklch(0.65 0.18 260)" },
  { time: "14:00", subject: "History", room: "Room 108", color: "oklch(0.68 0.19 40)" },
];

const assignments = [
  { subject: "Chemistry", title: "Lab report — Titration", due: "Tomorrow", priority: "high" },
  { subject: "English", title: "Essay draft: Gatsby", due: "Fri", priority: "med" },
];

const exams = [
  { subject: "Calculus", title: "Midterm Exam", date: "Nov 24", days: 6 },
];

function Dashboard() {
  const { profile } = useProfile();
  const firstName = (profile?.full_name || "").trim().split(" ")[0] || "there";
  return (
    <div className="px-5 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{today}</p>
          <h1 className="mt-1 font-display text-2xl font-bold">
            Hi, {firstName} <span className="inline-block">👋</span>
          </h1>
        </div>

        <button className="relative grid size-11 place-items-center rounded-2xl border border-border bg-card shadow-soft">
          <Bell className="size-5" />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
        </button>
      </div>

      {/* Motivational quote */}
      <div className="mt-5 rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
        <div className="flex items-start gap-3">
          <Sparkles className="size-5 shrink-0" />
          <div>
            <p className="text-xs font-medium opacity-80">Daily motivation</p>
            <p className="mt-1 font-display text-base font-semibold leading-snug">
              "Small daily improvements are the key to staggering long-term results."
            </p>
          </div>
        </div>
      </div>

      {/* Streak + Goal */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Flame className="size-3.5 text-warning" /> Streak
          </div>
          <p className="mt-1 font-display text-2xl font-bold">12<span className="text-sm text-muted-foreground"> days</span></p>
          <div className="mt-2 flex gap-1">
            {[1,2,3,4,5,6,7].map((d, i) => (
              <div key={d} className={`h-1.5 flex-1 rounded-full ${i < 5 ? "bg-gradient-brand" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5 text-primary" /> Daily goal
          </div>
          <p className="mt-1 font-display text-2xl font-bold">1h 45m<span className="text-sm text-muted-foreground"> / 2h</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[85%] rounded-full bg-gradient-brand" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <SectionHeader title="Quick actions" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          <QuickAction icon={Brain} label="AI Tutor" to="/app/ai" tint="oklch(0.6 0.2 275)" />
          <QuickAction icon={BookOpen} label="Homework" to="/app/planner" tint="oklch(0.65 0.18 250)" />
          <QuickAction icon={ScanLine} label="Scan" to="/app/study" tint="oklch(0.6 0.22 320)" />
          <QuickAction icon={Timer} label="Focus" to="/app/study" tint="oklch(0.65 0.18 200)" />
        </div>
      </div>

      {/* Today's classes */}
      <div className="mt-6">
        <SectionHeader title="Today's classes" action="See all" />
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {classes.map((c) => (
            <div key={c.subject} className="min-w-[160px] rounded-3xl bg-card p-4 shadow-soft">
              <div className="size-2 rounded-full" style={{ background: c.color }} />
              <p className="mt-3 text-xs font-medium text-muted-foreground">{c.time}</p>
              <p className="mt-0.5 font-display text-base font-bold">{c.subject}</p>
              <p className="text-xs text-muted-foreground">{c.room}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming assignments */}
      <div className="mt-6">
        <SectionHeader title="Upcoming assignments" action="See all" to="/app/planner" />
        <div className="mt-3 space-y-2.5">
          {assignments.map((a) => (
            <div key={a.title} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
              <div className="grid size-11 place-items-center rounded-2xl bg-accent">
                <BookOpen className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.subject} · Due {a.due}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                a.priority === "high" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning"
              }`}>
                {a.priority === "high" ? "High" : "Med"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming exams */}
      <div className="mt-6">
        <SectionHeader title="Upcoming exams" />
        <div className="mt-3 space-y-2.5">
          {exams.map((e) => (
            <div key={e.title} className="flex items-center gap-3 overflow-hidden rounded-3xl bg-gradient-brand p-4 text-white shadow-glow">
              <div className="grid size-12 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                <GraduationCap className="size-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs opacity-80">{e.subject}</p>
                <p className="font-display text-base font-bold">{e.title}</p>
                <p className="text-xs opacity-80">{e.date}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold">{e.days}</p>
                <p className="text-[10px] opacity-80">days</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievement teaser */}
      <div className="mt-6 flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid size-11 place-items-center rounded-2xl bg-accent">
          <Trophy className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Level 7 · 320 XP to next</p>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[62%] rounded-full bg-gradient-brand" />
          </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <CalendarDays className="size-3" /> Coming soon: AI voice tutor · Study groups
      </div>
    </div>
  );
}

function SectionHeader({ title, action, to }: { title: string; action?: string; to?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {action && (
        to
          ? <Link to={to} className="text-xs font-semibold text-primary">{action}</Link>
          : <button className="text-xs font-semibold text-primary">{action}</button>
      )}
    </div>
  );
}

function QuickAction({
  icon: Icon, label, to, tint,
}: { icon: typeof Brain; label: string; to: string; tint: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 active:scale-95 transition">
      <div
        className="grid size-14 place-items-center rounded-2xl shadow-soft"
        style={{ background: `color-mix(in oklab, ${tint} 15%, var(--card))` }}
      >
        <Icon className="size-6" style={{ color: tint }} strokeWidth={2.2} />
      </div>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}
