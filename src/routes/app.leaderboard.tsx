import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({
    meta: [
      { title: "School Leaderboard — StudySphere" },
      { name: "description", content: "See classmates who chose to appear, ranked by real learning activity." },
      { property: "og:title", content: "School Leaderboard — StudySphere" },
      { property: "og:description", content: "See classmates who chose to appear, ranked by real learning activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LeaderboardPage,
});

type Row = { user_id: string; name: string; lessons: number; questions: number; sessions: number; score: number; is_me: boolean };
const rpc = supabase as unknown as { rpc: (f: string, a: object) => Promise<{ data: Row[] | null; error: Error | null }> };
const db = supabase as unknown as { from: (t: string) => any };

function LeaderboardPage() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");
  const [visible, setVisible] = useState<boolean | null>(null);
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const { data, error } = await rpc.rpc("school_leaderboard", { _period: period });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: u }) => {
      if (!u.user) return;
      const { data: p } = await db.from("profiles").select("leaderboard_visible").eq("id", u.user.id).maybeSingle();
      setVisible(!!p?.leaderboard_visible);
    });
  }, []);

  async function toggle() {
    const { data: u } = await supabase.auth.getUser();
    const next = !visible;
    const { error } = await db.from("profiles").update({ leaderboard_visible: next }).eq("id", u.user!.id);
    if (error) return toast.error("Couldn't change that setting");
    setVisible(next); refetch();
    toast.success(next ? "You now appear on the leaderboard" : "You're hidden from the leaderboard");
  }

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-2">
        <Link to="/app/learn" aria-label="Back to Learn" className="grid size-9 place-items-center rounded-3xl bg-card shadow-soft"><ArrowLeft className="size-4" /></Link>
        <div>
          <h1 className="font-display text-2xl font-bold">School Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Lessons, quiz questions and study sessions only</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-card p-1 shadow-soft">
        {(["week", "month", "all"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`rounded-full py-2 text-xs font-semibold ${period === p ? "bg-gradient-brand text-primary-foreground" : "text-muted-foreground"}`}>
            {p === "week" ? "Week" : p === "month" ? "Month" : "All Time"}
          </button>
        ))}
      </div>

      {visible !== null && (
        <button onClick={toggle} className="mt-3 flex w-full items-center justify-between rounded-3xl bg-card p-3.5 text-left shadow-soft">
          <div><p className="text-sm font-semibold">Show me on the leaderboard</p><p className="text-xs text-muted-foreground">Only your display name and activity counts are shown — never grades or private work.</p></div>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${visible ? "bg-primary" : "bg-muted"}`}><span className={`absolute top-0.5 size-5 rounded-full bg-card transition-all ${visible ? "left-[22px]" : "left-0.5"}`} /></span>
        </button>
      )}

      {isLoading ? (
        <div className="mt-10 flex justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
      ) : data.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-semibold">Not enough activity yet</p>
          <p className="text-xs text-muted-foreground">Complete Learn lessons, answer quiz questions or log study sessions to appear here.</p>
        </div>
      ) : (
        <ol className="mt-4 space-y-2">
          {data.map((r, i) => (
            <li key={r.user_id} className={`flex items-center gap-3 rounded-3xl p-3.5 shadow-soft ${r.is_me ? "bg-accent" : "bg-card"}`}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}{r.is_me ? " (you)" : ""}</p>
                <p className="text-[11px] text-muted-foreground">{r.lessons} lessons · {r.questions} questions · {r.sessions} sessions</p>
              </div>
              <span className="text-sm font-bold text-primary">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
      {visible === false && data.some((r) => r.is_me) && <p className="mt-3 text-center text-[11px] text-muted-foreground">Only you can see your own row until you turn on “Show me”.</p>}
    </div>
  );
}
