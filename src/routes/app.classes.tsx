import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Loader2, Search, Trash2, GraduationCap } from "lucide-react";
import { useClasses, useDeleteClass, useSetCourses } from "@/hooks/use-study-data";
import { supabase } from "@/integrations/supabase/client";
import { GEMS_CATEGORIES, GEMS_COURSES, parseGrade } from "@/lib/gems-courses";

export const Route = createFileRoute("/app/classes")({
  head: () => ({
    meta: [
      { title: "My Courses — StudySphere" },
      { name: "description", content: "Choose the official GEMS American Academy Abu Dhabi courses you take." },
      { property: "og:title", content: "My Courses — StudySphere" },
      { property: "og:description", content: "Choose the official GEMS American Academy Abu Dhabi courses you take." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const { data: classes = [], isLoading } = useClasses();
  const save = useSetCourses();
  const removeLegacy = useDeleteClass();
  const [grade, setGrade] = useState<number | null>(null);
  const [gradeLoaded, setGradeLoaded] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("grade_year").eq("id", data.user.id).maybeSingle();
      setGrade(parseGrade(p?.grade_year));
      setGradeLoaded(true);
    });
  }, []);

  const saved = useMemo(() => new Set(classes.map((c) => c.course_id).filter(Boolean) as string[]), [classes]);
  useEffect(() => { setSelected(new Set(saved)); }, [saved]);
  const legacy = classes.filter((c) => !c.course_id);

  const available = GEMS_COURSES.filter(
    (c) => (grade === null || c.grades.includes(grade) || saved.has(c.id)) && c.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  const add = [...selected].filter((id) => !saved.has(id));
  const remove = [...saved].filter((id) => !selected.has(id));
  const dirty = add.length + remove.length > 0;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  }

  function submit() {
    save.mutate({
      add: add.map((id) => ({ id, name: GEMS_COURSES.find((c) => c.id === id)!.name })),
      remove,
    });
  }

  return (
    <div className="px-5 pb-32 pt-6">
      <div className="flex items-center gap-2">
        <Link to="/app/profile" aria-label="Back to profile" className="grid size-9 place-items-center rounded-3xl bg-card shadow-soft active:scale-95">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">My Courses</h1>
          <p className="text-xs text-muted-foreground">
            {gradeLoaded && grade !== null ? `Official courses for Grade ${grade}` : "Official GEMS American Academy Abu Dhabi courses"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-3xl border border-border bg-card px-4 py-3">
        <Search className="size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search courses" className="w-full bg-transparent text-sm outline-none" />
      </div>

      {saved.size === 0 && !isLoading && (
        <div className="mt-4 rounded-3xl border border-dashed border-border p-5 text-center">
          <GraduationCap className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">No courses yet</p>
          <p className="text-xs text-muted-foreground">Tick the courses you take below, then save. Your notes, flashcards, assignments and grades connect to them.</p>
        </div>
      )}

      {isLoading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mt-5 space-y-5">
          {GEMS_CATEGORIES.map((cat) => {
            const items = available.filter((c) => c.category === cat);
            if (!items.length) return null;
            return (
              <div key={cat}>
                <h2 className="font-display text-sm font-bold text-muted-foreground">{cat}</h2>
                <div className="mt-2 space-y-2">
                  {items.map((c) => {
                    const on = selected.has(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggle(c.id)}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-3 rounded-3xl border p-3.5 text-left text-sm font-semibold shadow-soft transition active:scale-[0.99] ${on ? "border-primary bg-accent" : "border-border bg-card"}`}
                      >
                        <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {available.length === 0 && <p className="text-center text-sm text-muted-foreground">No courses match “{q}”.</p>}

          {legacy.length > 0 && (
            <div>
              <h2 className="font-display text-sm font-bold text-muted-foreground">Older custom classes</h2>
              <p className="text-xs text-muted-foreground">These aren't on the official list. Remove them once you've picked the matching course.</p>
              <div className="mt-2 space-y-2">
                {legacy.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-3xl bg-card p-3.5 shadow-soft">
                    <p className="flex-1 truncate text-sm font-semibold">{c.subject}</p>
                    <button onClick={() => removeLegacy.mutate(c.id)} aria-label={`Remove ${c.subject}`} className="grid size-9 place-items-center rounded-3xl bg-destructive/10">
                      <Trash2 className="size-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {dirty && (
        <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-md px-5">
          <button
            onClick={submit}
            disabled={save.isPending}
            className="w-full rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-70"
          >
            {save.isPending ? "Saving…" : `Save courses (${selected.size} selected)`}
          </button>
        </div>
      )}
    </div>
  );
}
