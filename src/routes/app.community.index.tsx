import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Lock, Search, Check, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import {
  useCommunityProfile, useUpdateCommunityProfile, useEnrollments, useSetEnrollments,
} from "@/hooks/use-community";
import { GEMS_COURSES, GEMS_CATEGORIES, GEMS_SCHOOL_NAME, courseById, parseGrade } from "@/lib/gems-courses";

export const Route = createFileRoute("/app/community/")({
  head: () => ({
    meta: [
      { title: "GEMS Community — StudySphere AI" },
      { name: "description", content: "Find classmates in your exact GEMS American Academy courses and share flashcards." },
      { property: "og:title", content: "GEMS Community — StudySphere AI" },
      { property: "og:description", content: "Class communities for GEMS American Academy Abu Dhabi students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CommunityHome,
});

function CommunityHome() {
  const { data: profile, isLoading } = useCommunityProfile();
  const update = useUpdateCommunityProfile();

  if (isLoading) return <div className="grid place-items-center pt-24"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  if (profile?.gems_status !== "member") {
    return (
      <div className="px-5 pt-10">
        <div className="grid size-12 place-items-center rounded-3xl bg-muted"><Lock className="size-6 text-muted-foreground" /></div>
        <h1 className="mt-5 font-display text-2xl font-bold">GEMS Community</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This space is only for students at {GEMS_SCHOOL_NAME}. You can keep using every other StudySphere feature.
        </p>
        <div className="mt-6 rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold">Are you a student at {GEMS_SCHOOL_NAME}?</p>
          <button
            disabled={update.isPending}
            onClick={() => update.mutate({ gems_status: "member" })}
            className="mt-4 w-full rounded-3xl bg-gradient-brand px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            Yes, I'm a GEMS American Academy student
          </button>
          <Link to="/app" className="mt-2 block w-full rounded-3xl border border-border px-5 py-3.5 text-center text-sm font-semibold">
            No, I'm not
          </Link>
        </div>
      </div>
    );
  }

  return <MemberView grade={parseGrade(profile.grade_year)} visible={profile.community_visible} displayName={profile.display_name} verified={profile.gems_verified} />;
}

function MemberView({ grade, visible, displayName, verified }: { grade: number | null; visible: boolean; displayName: string | null; verified: boolean }) {
  const update = useUpdateCommunityProfile();
  const { data: enrolled = [], isLoading } = useEnrollments();
  const save = useSetEnrollments();
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [allGrades, setAllGrades] = useState(grade === null);
  const [name, setName] = useState(displayName ?? "");

  useEffect(() => { setSelected(new Set(enrolled)); }, [enrolled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GEMS_COURSES.filter((c) =>
      (allGrades || grade === null || c.grades.includes(grade) || selected.has(c.id)) &&
      (!q || c.name.toLowerCase().includes(q)));
  }, [query, allGrades, grade, selected]);

  function toggle(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function commit() {
    const add = [...selected].filter((id) => !enrolled.includes(id));
    const remove = enrolled.filter((id) => !selected.has(id));
    save.mutate({ add, remove }, { onSuccess: () => setPicking(false) });
  }

  return (
    <div className="px-5 pt-8">
      <div className="flex items-center gap-3">
        <div className="grid size-12 place-items-center rounded-3xl bg-gradient-brand shadow-glow"><Users className="size-6 text-primary-foreground" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight">GEMS Community</h1>
          <p className="text-xs text-muted-foreground">{GEMS_SCHOOL_NAME}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5" /> {verified ? "School membership verified" : "Self-confirmed member — school verification isn't set up yet"}
      </p>

      <section className="mt-5 rounded-3xl bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Show me to classmates</p>
            <p className="text-xs text-muted-foreground">Only your name and courses — never grades, notes or email.</p>
          </div>
          <button
            role="switch" aria-checked={visible}
            onClick={() => update.mutate({ community_visible: !visible })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${visible ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-card shadow transition ${visible ? "left-6" : "left-1"}`} />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Display name (optional)" className="input flex-1" />
          <button
            disabled={name.trim() === (displayName ?? "") || update.isPending}
            onClick={() => update.mutate({ display_name: name.trim() || null })}
            className="rounded-3xl bg-accent px-4 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >Save</button>
        </div>
      </section>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">My courses</h2>
        <button onClick={() => setPicking((p) => !p)} className="text-sm font-semibold text-primary">
          {picking ? "Close" : enrolled.length ? "Edit" : "Choose"}
        </button>
      </div>

      {picking ? (
        <section className="mt-3 rounded-3xl bg-card p-4 shadow-soft">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses" className="input pl-9" />
          </div>
          {grade !== null && (
            <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={allGrades} onChange={(e) => setAllGrades(e.target.checked)} />
              Show courses from all grades (showing Grade {grade} by default)
            </label>
          )}
          <div className="mt-3 max-h-[50vh] space-y-4 overflow-y-auto pr-1">
            {GEMS_CATEGORIES.map((cat) => {
              const list = filtered.filter((c) => c.category === cat);
              if (!list.length) return null;
              return (
                <div key={cat}>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{cat}</p>
                  <div className="space-y-1.5">
                    {list.map((c) => {
                      const on = selected.has(c.id);
                      return (
                        <button key={c.id} onClick={() => toggle(c.id)}
                          className={`flex w-full items-center justify-between rounded-2xl border px-3 py-2.5 text-left text-sm transition ${on ? "border-primary bg-accent" : "border-border"}`}>
                          {c.name}{on && <Check className="size-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {!filtered.length && <p className="py-6 text-center text-sm text-muted-foreground">No courses match "{query}".</p>}
          </div>
          <button onClick={commit} disabled={save.isPending}
            className="mt-4 w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
            Save {selected.size} course{selected.size === 1 ? "" : "s"}
          </button>
        </section>
      ) : isLoading ? null : enrolled.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-dashed border-border p-6 text-center">
          <p className="font-semibold">No courses yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Choose the GEMS courses you take to meet classmates and share flashcards.</p>
          <button onClick={() => setPicking(true)} className="mt-4 rounded-3xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground">Choose courses</button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {enrolled.map((id) => (
            <Link key={id} to="/app/community/$courseId" params={{ courseId: id }}
              className="flex items-center justify-between rounded-3xl bg-card p-4 shadow-soft active:scale-[0.98]">
              <div>
                <p className="text-sm font-semibold">{courseById(id)?.name ?? id}</p>
                <p className="text-xs text-muted-foreground">{courseById(id)?.category}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
