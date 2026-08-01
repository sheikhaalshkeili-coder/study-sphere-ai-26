import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Finish setting up — StudySphere" },
      { name: "description", content: "Tell us about your school so StudySphere can personalize your planner." },
      { property: "og:title", content: "Finish setting up — StudySphere" },
      { property: "og:description", content: "Tell us about your school so StudySphere can personalize your planner." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const [level, setLevel] = useState<"high_school" | "university">("high_school");
  const [gradeYear, setGradeYear] = useState("");
  const [school, setSchool] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("education_level, grade_year, school_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (p?.education_level) setLevel(p.education_level as "high_school" | "university");
      if (p?.grade_year) setGradeYear(p.grade_year);
      if (p?.school_name) setSchool(p.school_name);
    });
  }, []);

  const valid = gradeYear.trim().length > 0 && school.trim().length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving(false);
      navigate({ to: "/auth" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userData.user.id,
          full_name: userData.user.user_metadata?.["full_name"] ?? userData.user.user_metadata?.["name"] ?? "",
          education_level: level,
          grade_year: gradeYear.trim(),
          school_name: school.trim(),
        },
        { onConflict: "id" },
      );
    setSaving(false);
    if (error) {
      toast.error("Couldn't save your details");
      return;
    }
    toast.success("You're all set!");
    navigate({ to: "/app", replace: true });
  }

  return (
    <div className="px-5 pt-10">
      <div className="grid size-12 place-items-center rounded-3xl bg-gradient-brand shadow-glow">
        <GraduationCap className="size-6 text-white" strokeWidth={2.4} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold leading-tight">A couple of quick questions</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This helps StudySphere tailor your planner and AI answers to your level.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">I'm in</span>
          <div className="grid grid-cols-2 gap-2.5">
            {(["high_school", "university"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setLevel(opt)}
                className={`rounded-3xl border p-3.5 text-sm font-semibold shadow-soft transition active:scale-[0.98] ${
                  level === opt ? "border-primary bg-accent text-accent-foreground" : "border-border bg-card"
                }`}
              >
                {opt === "high_school" ? "High school" : "University"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {level === "high_school" ? "Grade" : "Year"}
          </span>
          <input
            value={gradeYear}
            onChange={(e) => setGradeYear(e.target.value)}
            maxLength={20}
            placeholder={level === "high_school" ? "Grade 11" : "Year 2"}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {level === "high_school" ? "School" : "University"}
          </span>
          <input
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            maxLength={120}
            placeholder="Lincoln High"
            className="input"
          />
        </label>

        <button
          type="submit"
          disabled={!valid || saving}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-brand px-5 py-4 text-sm font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue
          {!saving && <ArrowRight className="size-4" />}
        </button>
      </form>
    </div>
  );
}
