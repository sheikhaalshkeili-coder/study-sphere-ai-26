import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Brain, Timer, ArrowRight, Apple, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "StudySphere  - Your all-in-one student companion" },
      { name: "description", content: "Plan homework, study smarter with AI, and ace exams all in one polished app." },
    ],
  }),
  component: Welcome,
});


function Welcome() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleGoogle() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/app",
    });
    if (result.error || !result.redirected) setBusy(false);
    if (!result.error && !result.redirected) navigate({ to: "/app" });
  }

  return (
    <main className="min-h-screen bg-gradient-soft">

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-14 pb-8">
        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="size-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold">StudySphere</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">AI</span>
        </div>

        {/* Hero visual */}
        <div className="relative mt-10 aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-card shadow-soft">
          <div className="absolute inset-0 bg-gradient-brand opacity-90" />
          <div className="absolute -left-10 -top-10 size-56 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -right-12 bottom-12 size-64 rounded-full bg-white/10 blur-3xl" />

          {/* Floating cards */}
          <div className="absolute left-6 top-6 rounded-2xl bg-white/95 p-3 shadow-soft backdrop-blur">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-xl bg-gradient-brand">
                <Brain className="size-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">AI Tutor</p>
                <p className="text-xs font-semibold text-foreground">Explain photosynthesis</p>
              </div>
            </div>
          </div>

          <div className="absolute right-5 top-32 rounded-2xl bg-white/95 p-3 shadow-soft">
            <p className="text-[10px] font-medium text-muted-foreground">Study Streak</p>
            <p className="mt-0.5 font-display text-xl font-bold text-gradient-brand">🔥 12 days</p>
          </div>

          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/95 p-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Daily goal</p>
                <p className="text-xs font-semibold">1h 45m / 2h</p>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-accent">
                <Timer className="size-4 text-primary" />
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[85%] rounded-full bg-gradient-brand" />
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h1 className="font-display text-3xl font-bold leading-tight">
            Study smarter,<br />
            <span className="text-gradient-brand">not harder.</span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your AI-powered study buddy — plan homework, master concepts, and crush every exam. All in one place.
          </p>
        </div>

        <div className="mt-auto space-y-2.5 pt-8">
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-4 text-sm font-semibold text-white shadow-glow transition active:scale-[0.98]"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <button
            onClick={handleGoogle}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold shadow-soft active:scale-[0.98] disabled:opacity-60"
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            disabled
            title="Coming soon"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold shadow-soft opacity-60"
          >
            <Apple className="size-4 fill-current" /> Continue with Apple
          </button>
          <Link to="/auth" className="flex w-full items-center justify-center gap-2 py-2 text-xs font-medium text-muted-foreground">
            <Mail className="size-3.5" /> Sign in with email
          </Link>
        </div>
      </div>

    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.98 6.98 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.87l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
