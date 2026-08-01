import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Settings, Bell, Moon, ChevronRight, GraduationCap, Target,
  LogOut, CalendarDays, CheckCircle2, BookOpen, ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { useAssignments, useClasses, useExams } from "@/hooks/use-study-data";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — StudySphere" },
      { name: "description", content: "Your StudySphere account, study stats and app preferences." },
      { property: "og:title", content: "Your profile — StudySphere" },
      { property: "og:description", content: "Your StudySphere account, study stats and app preferences." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState(true);
  const { profile, email } = useProfile();
  const navigate = useNavigate();

  const { data: classes = [] } = useClasses();
  const { data: assignments = [] } = useAssignments();
  const { data: exams = [] } = useExams();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const name = profile?.full_name || email || "Student";
  const initial = (profile?.full_name || email || "S").trim().charAt(0).toUpperCase();
  const levelLabel = profile?.education_level === "university" ? "University" : "High school";
  const gradeLabel = profile?.grade_year ? `${profile.grade_year} · ` : "";
  const schoolLabel = profile?.school_name || levelLabel;

  const completed = assignments.filter((a) => a.done).length;
  const open = assignments.filter((a) => !a.done).length;
  const total = assignments.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const upcomingExams = exams.filter((e) => new Date(e.exam_at).getTime() >= Date.now()).length;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <Link
          to="/app/onboarding"
          aria-label="Edit school details"
          className="grid size-11 place-items-center rounded-3xl border border-border bg-card shadow-soft"
        >
          <Settings className="size-5" />
        </Link>
      </div>

      {/* Profile card */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-3xl bg-white/20 backdrop-blur">
            <span className="font-display text-2xl font-bold">{initial}</span>
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">{name}</p>
            <p className="text-xs opacity-80">{gradeLabel}{schoolLabel}</p>
            {email && <p className="mt-0.5 text-[11px] opacity-70">{email}</p>}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] opacity-80">
            <span>{total > 0 ? `${completed} of ${total} tasks completed` : "No tasks yet"}</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* Real stats */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { icon: BookOpen, k: "Classes", v: String(classes.length), tint: "oklch(0.62 0.19 265)" },
          { icon: CheckCircle2, k: "Completed", v: String(completed), tint: "oklch(0.7 0.15 155)" },
          { icon: ClipboardList, k: "Open tasks", v: String(open), tint: "oklch(0.7 0.18 40)" },
        ].map((s) => (
          <div key={s.k} className="rounded-3xl bg-card p-3 text-center shadow-soft">
            <s.icon className="mx-auto size-4" style={{ color: s.tint }} />
            <p className="mt-1 font-display text-lg font-bold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.k}</p>
          </div>
        ))}
      </div>

      {/* GPA — no grades feature yet, so show an honest empty state */}
      <div className="mt-4 flex items-center gap-3 rounded-3xl border border-dashed border-border p-4">
        <div className="grid size-10 place-items-center rounded-3xl bg-accent">
          <Target className="size-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">GPA tracking</p>
          <p className="text-xs text-muted-foreground">Add grades to see your GPA — grade entry is coming soon.</p>
        </div>
      </div>

      {/* At a glance */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold">At a glance</h2>
        <div className="mt-3 space-y-2.5">
          <Link to="/app/classes" className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-3xl bg-accent">
              <GraduationCap className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">My classes</p>
              <p className="text-xs text-muted-foreground">
                {classes.length > 0 ? `${classes.length} saved` : "Add your timetable"}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
          <Link to="/app/planner" className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
            <div className="grid size-10 place-items-center rounded-3xl bg-accent">
              <CalendarDays className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Upcoming exams</p>
              <p className="text-xs text-muted-foreground">
                {upcomingExams > 0 ? `${upcomingExams} scheduled` : "Nothing scheduled"}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Settings */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold">Preferences</h2>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-3xl bg-card shadow-soft">
          <SettingRow icon={Moon} label="Dark mode" active={dark} onToggle={() => setDark((d) => !d)} />
          <SettingRow icon={Bell} label="Notifications" active={notifs} onToggle={() => setNotifs((n) => !n)} />
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive shadow-soft"
      >
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}

function SettingRow({
  icon: Icon, label, active, onToggle,
}: { icon: typeof Bell; label: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid size-9 place-items-center rounded-3xl bg-accent">
        <Icon className="size-4 text-primary" />
      </div>
      <p className="flex-1 text-sm font-semibold">{label}</p>
      <button
        onClick={onToggle}
        aria-label={label}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-gradient-brand" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${active ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
