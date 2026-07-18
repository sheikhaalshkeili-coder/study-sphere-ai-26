import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Settings, Award, Flame, Trophy, Bell, Moon, ChevronRight,
  Heart, GraduationCap, Target, LogOut, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  component: Profile,
});

function Profile() {
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <button className="grid size-11 place-items-center rounded-2xl border border-border bg-card shadow-soft">
          <Settings className="size-5" />
        </button>
      </div>

      {/* Profile card */}
      <div className="mt-5 overflow-hidden rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <span className="font-display text-2xl font-bold">A</span>
          </div>
          <div className="flex-1">
            <p className="font-display text-lg font-bold">Alex Chen</p>
            <p className="text-xs opacity-80">Grade 11 · Lincoln High</p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs">
              <Sparkles className="size-3.5" />
              <span className="font-semibold">Level 7</span>
              <span className="opacity-70">· 2,480 XP</span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] opacity-80">
            <span>320 XP to Level 8</span>
            <span>62%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full w-[62%] rounded-full bg-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {[
          { icon: Flame, k: "Streak", v: "12", tint: "oklch(0.7 0.18 40)" },
          { icon: Trophy, k: "Badges", v: "18", tint: "oklch(0.7 0.18 90)" },
          { icon: Target, k: "GPA", v: "3.86", tint: "oklch(0.7 0.15 155)" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-card p-3 text-center shadow-soft">
            <s.icon className="mx-auto size-4" style={{ color: s.tint }} />
            <p className="mt-1 font-display text-lg font-bold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.k}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold">Achievements</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { icon: Flame, label: "10-day streak", got: true },
            { icon: Award, label: "Quiz master", got: true },
            { icon: GraduationCap, label: "Straight A's", got: true },
            { icon: Trophy, label: "100 sessions", got: false },
            { icon: Heart, label: "Note taker", got: false },
          ].map((a) => (
            <div key={a.label} className="min-w-[86px] rounded-2xl bg-card p-3 text-center shadow-soft">
              <div className={`mx-auto grid size-11 place-items-center rounded-2xl ${a.got ? "bg-gradient-brand text-white" : "bg-muted text-muted-foreground"}`}>
                <a.icon className="size-5" />
              </div>
              <p className="mt-2 text-[11px] font-semibold">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* University Hub */}
      <div className="mt-6">
        <h2 className="font-display text-base font-bold">University Hub</h2>
        <div className="mt-3 space-y-2.5">
          {[
            { icon: Heart, label: "Volunteer hours", meta: "42 / 60 hrs" },
            { icon: Award, label: "Extracurriculars", meta: "5 active" },
            { icon: GraduationCap, label: "Application checklist", meta: "8 / 12 done" },
            { icon: Target, label: "Career goals", meta: "Set your path" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-card p-3.5 shadow-soft">
              <div className="grid size-10 place-items-center rounded-2xl bg-accent">
                <r.icon className="size-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.meta}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          ))}
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

      {/* Coming soon */}
      <div className="mt-6 rounded-3xl border border-dashed border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Coming soon</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {["AI voice tutor", "Study groups", "Live tutoring", "Timetable sync", "PDF import", "Cloud backup", "Parent dashboard"].map((c) => (
            <span key={c} className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">{c}</span>
          ))}
        </div>
      </div>

      <Link to="/" className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive shadow-soft">
        <LogOut className="size-4" /> Sign out
      </Link>
    </div>
  );
}

function SettingRow({
  icon: Icon, label, active, onToggle,
}: { icon: typeof Bell; label: string; active: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="grid size-9 place-items-center rounded-2xl bg-accent">
        <Icon className="size-4 text-primary" />
      </div>
      <p className="flex-1 text-sm font-semibold">{label}</p>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition ${active ? "bg-gradient-brand" : "bg-muted"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${active ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
