import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Sparkles, Brain, BookOpen, ScanLine, CalendarDays, LayoutList,
  GraduationCap, CheckCircle2, ChevronRight, Bell, Loader2,
} from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useAssignments, useClasses, useExams } from "@/hooks/use-study-data";
import { colorOf, dayOffset, endOfWeek, formatDue, formatTime, startOfWeek } from "@/lib/schedule";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — StudySphere" },
      { name: "description", content: "Today's classes, upcoming assignments and exams, all from your own data." },
      { property: "og:title", content: "Dashboard — StudySphere" },
      { property: "og:description", content: "Today's classes, upcoming assignments and exams, all from your own data." },
    ],
  }),
  component: Dashboard,
});


const today = new Date().toLocaleDateString("en-US", {
  weekday: "long", month: "long", day: "numeric",
});

function Dashboard() {
  const { profile } = useProfile();
  const firstName = (profile?.full_name || "").trim().split(" ")[0] || "there";

  const { data: classes = [], isLoading: lc } = useClasses();
  const { data: assignments = [], isLoading: la } = useAssignments();
  const { data: exams = [], isLoading: le } = useExams();

  const todaysClasses = useMemo(() => {
    const dow = new Date().getDay();
    return classes.filter((c) => c.day_of_week === dow);
  }, [classes]);

  const upcoming = useMemo(
    () =>
      assignments
        .filter((a) => !a.done && a.due_at && dayOffset(a.due_at) >= -7)
        .slice(0, 4),
    [assignments],
  );

  const nextExams = useMemo(
    () => exams.filter((e) => new Date(e.exam_at) >= new Date()).slice(0, 2),
    [exams],
  );

  const week = useMemo(() => {
    const from = startOfWeek().getTime();
    const to = endOfWeek().getTime();
    const inWeek = assignments.filter((a) => {
      if (!a.due_at) return false;
      const t = new Date(a.due_at).getTime();
      return t >= from && t < to;
    });
    const done = inWeek.filter((a) => a.done).length;
    return { done, total: inWeek.length, pct: inWeek.length ? Math.round((done / inWeek.length) * 100) : 0 };
  }, [assignments]);

  const loading = lc || la || le;

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

        <button className="relative grid size-11 place-items-center rounded-3xl border border-border bg-card shadow-soft">
          <Bell className="size-5" />
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

      {/* Real stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success" /> Done this week
          </div>
          <p className="mt-1 font-display text-2xl font-bold">
            {week.done}
            <span className="text-sm text-muted-foreground"> / {week.total}</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-brand" style={{ width: `${week.pct}%` }} />
          </div>
        </div>
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <GraduationCap className="size-3.5 text-primary" /> Next exam
          </div>
          <p className="mt-1 font-display text-2xl font-bold">
            {nextExams[0] ? (
              <>
                {Math.max(0, dayOffset(nextExams[0].exam_at))}
                <span className="text-sm text-muted-foreground"> days</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">None scheduled</span>
            )}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{nextExams[0]?.title ?? "Add one in Planner"}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6">
        <SectionHeader title="Quick actions" />
        <div className="mt-3 grid grid-cols-4 gap-3">
          <QuickAction icon={Brain} label="AI Tutor" to="/app/ai" tint="oklch(0.6 0.2 275)" />
          <QuickAction icon={LayoutList} label="Classes" to="/app/classes" tint="oklch(0.65 0.18 250)" />
          <QuickAction icon={BookOpen} label="Planner" to="/app/planner" tint="oklch(0.6 0.22 320)" />
          <QuickAction icon={ScanLine} label="Study" to="/app/study" tint="oklch(0.65 0.18 200)" />
        </div>
      </div>

      {loading && (
        <div className="mt-8 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Today's classes */}
      {!loading && (
        <div className="mt-6">
          <SectionHeader title="Today's classes" action="See all" to="/app/classes" />
          {todaysClasses.length === 0 ? (
            <EmptyCard text="No classes today. Add your timetable in My classes." to="/app/classes" />
          ) : (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {todaysClasses.map((c) => (
                <div key={c.id} className="min-w-[160px] rounded-3xl bg-card p-4 shadow-soft">
                  <div className="size-2 rounded-full" style={{ background: colorOf(c.color) }} />
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{formatTime(c.start_time) || "—"}</p>
                  <p className="mt-0.5 font-display text-base font-bold">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">{c.room || c.teacher || ""}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming assignments */}
      {!loading && (
        <div className="mt-6">
          <SectionHeader title="Upcoming assignments" action="See all" to="/app/planner" />
          {upcoming.length === 0 ? (
            <EmptyCard text="Nothing due — add work from the Planner." to="/app/planner" />
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
                  <div className="grid size-11 place-items-center rounded-3xl bg-accent">
                    <BookOpen className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[a.subject, a.type].filter(Boolean).join(" · ")} · {formatDue(a.due_at)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    a.priority === "high" ? "bg-destructive/10 text-destructive"
                      : a.priority === "low" ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }`}>
                    {a.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming exams */}
      {!loading && nextExams.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Upcoming exams" action="See all" to="/app/planner" />
          <div className="mt-3 space-y-2.5">
            {nextExams.map((e) => (
              <div key={e.id} className="flex items-center gap-3 overflow-hidden rounded-3xl bg-gradient-brand p-4 text-white shadow-glow">
                <div className="grid size-12 place-items-center rounded-3xl bg-white/20 backdrop-blur">
                  <GraduationCap className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs opacity-80">{e.subject ?? "Exam"}</p>
                  <p className="truncate font-display text-base font-bold">{e.title}</p>
                  <p className="text-xs opacity-80">
                    {new Date(e.exam_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold">{Math.max(0, dayOffset(e.exam_at))}</p>
                  <p className="text-[10px] opacity-80">days</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <CalendarDays className="size-3" /> Coming soon: AI voice tutor · Study groups
      </div>
    </div>
  );
}

function EmptyCard({ text, to }: { text: string; to: string }) {
  return (
    <Link to={to} className="mt-3 flex items-center gap-2 rounded-3xl border border-dashed border-border p-5 text-xs text-muted-foreground">
      <span className="flex-1">{text}</span>
      <ChevronRight className="size-4" />
    </Link>
  );
}

function SectionHeader({ title, action, to }: { title: string; action?: string; to?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {action && to && (
        <Link to={to} className="text-xs font-semibold text-primary">{action}</Link>
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
        className="grid size-14 place-items-center rounded-3xl shadow-soft"
        style={{ background: `color-mix(in oklab, ${tint} 15%, var(--card))` }}
      >
        <Icon className="size-6" style={{ color: tint }} strokeWidth={2.2} />
      </div>
      <span className="text-[11px] font-semibold">{label}</span>
    </Link>
  );
}
