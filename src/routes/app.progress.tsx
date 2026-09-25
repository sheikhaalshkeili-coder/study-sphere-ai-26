import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowLeft, Flame, Timer, Trophy, TrendingUp, CheckCircle2, Lock } from "lucide-react";
import {
  useAssignments,
  useClasses,
  useFlashcards,
  useGrades,
  useNotes,
  useStudySessions,
} from "@/hooks/use-study-data";
import { computeAchievements, computeStreak, minutesInLastDays, minutesPerDay } from "@/lib/stats";
import { computeGpa } from "@/lib/gpa";

export const Route = createFileRoute("/app/progress")({
  head: () => ({
    meta: [
      { title: "Progress — StudySphere AI" },
      { name: "description", content: "Your real study time, streak, completed work and earned achievements." },
      { property: "og:title", content: "Progress — StudySphere AI" },
      { property: "og:description", content: "Your real study time, streak, completed work and earned achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

function Progress() {
  const { data: classes = [] } = useClasses();
  const { data: assignments = [] } = useAssignments();
  const { data: sessions = [] } = useStudySessions();
  const { data: flashcards = [] } = useFlashcards();
  const { data: notes = [] } = useNotes();
  const { data: grades = [] } = useGrades();

  const streak = useMemo(() => computeStreak(sessions, assignments), [sessions, assignments]);
  const week = useMemo(() => minutesInLastDays(sessions, 7), [sessions]);
  const perDay = useMemo(() => minutesPerDay(sessions, 7), [sessions]);
  const achievements = useMemo(
    () => computeAchievements({ assignments, sessions, flashcards, notes, grades, streak }),
    [assignments, sessions, flashcards, notes, grades, streak],
  );
  const gpa = useMemo(() => computeGpa(grades, classes), [grades, classes]);
  const doneCount = assignments.filter((a) => a.done).length;

  const enoughData = sessions.length > 0 || doneCount > 0 || grades.length > 0;
  const maxMinutes = Math.max(1, ...perDay.map((d) => d.minutes));

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app/profile"
          aria-label="Back"
          className="grid size-10 place-items-center rounded-3xl border border-border bg-card shadow-soft active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold">Progress</h1>
          <p className="text-xs text-muted-foreground">Built only from what you've actually done</p>
        </div>
      </div>

      {!enoughData ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-6 text-center">
          <TrendingUp className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Not enough data yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Start studying to see your progress. Finish a task, run a focus session or record a grade.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link to="/app/study" className="rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow">
              Start studying
            </Link>
            <Link to="/app/planner" className="rounded-full border border-border px-4 py-2 text-xs font-semibold">
              Open planner
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat icon={<Flame className="size-3.5 text-warning" />} label="Streak" value={`${streak} ${streak === 1 ? "day" : "days"}`} />
            <Stat
              icon={<Timer className="size-3.5 text-primary" />}
              label="This week"
              value={`${Math.floor(week / 60)}h ${week % 60}m`}
            />
            <Stat icon={<CheckCircle2 className="size-3.5 text-success" />} label="Tasks completed" value={String(doneCount)} />
            <Stat
              icon={<TrendingUp className="size-3.5 text-primary" />}
              label="GPA"
              value={gpa === null ? "—" : gpa.toFixed(2)}
            />
          </div>

          <div className="mt-5 rounded-3xl bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Study time, last 7 days</p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {perDay.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-xl bg-gradient-brand"
                    style={{ height: `${Math.round((d.minutes / maxMinutes) * 100)}%`, minHeight: d.minutes ? 6 : 2 }}
                  />
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-6">
        <h2 className="font-display text-base font-bold">Achievements</h2>
        <p className="text-xs text-muted-foreground">Earned only from real activity in your account.</p>
        <div className="mt-3 space-y-2.5">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-3 rounded-3xl p-3.5 shadow-soft ${a.earned ? "bg-card" : "bg-muted/40"}`}
            >
              <div className={`grid size-10 place-items-center rounded-3xl ${a.earned ? "bg-accent" : "bg-muted"}`}>
                {a.earned ? <Trophy className="size-5 text-primary" /> : <Lock className="size-4 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${a.earned ? "" : "text-muted-foreground"}`}>{a.label}</p>
                <p className="truncate text-xs text-muted-foreground">{a.description}</p>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">{a.progress}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
