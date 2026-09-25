import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Sparkles, Mail, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — StudySphere AI" },
      { name: "description", content: "Sign in or create your StudySphere AI account." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [educationLevel, setEducationLevel] = useState<"high_school" | "university">("high_school");
  const [gradeYear, setGradeYear] = useState("");
  const [schoolName, setSchoolName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/app",
            data: {
              full_name: fullName,
              education_level: educationLevel,
              grade_year: gradeYear,
              school_name: schoolName,
            },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (!result.redirected) navigate({ to: "/app" });
  }

  return (
    <main className="min-h-screen bg-gradient-soft">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10 pb-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
            <Sparkles className="size-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold">StudySphere</span>
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">AI</span>
        </Link>

        <div className="mt-8">
          <h1 className="font-display text-3xl font-bold leading-tight">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Tell us a bit about school so we can personalize your study plan."
              : "Sign in to keep your streak going."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-sm font-semibold shadow-soft active:scale-[0.98] disabled:opacity-60"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === "signup" && (
            <>
              <Field label="Full name">
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  placeholder="Alex Chen"
                  className="input"
                />
              </Field>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="I'm in">
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value as "high_school" | "university")}
                    className="input"
                  >
                    <option value="high_school">High school</option>
                    <option value="university">University</option>
                  </select>
                </Field>
                <Field label={educationLevel === "high_school" ? "Grade" : "Year"}>
                  <input
                    value={gradeYear}
                    onChange={(e) => setGradeYear(e.target.value)}
                    maxLength={20}
                    placeholder={educationLevel === "high_school" ? "Grade 11" : "Year 2"}
                    className="input"
                  />
                </Field>
              </div>

              <Field label={educationLevel === "high_school" ? "School" : "University"}>
                <input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  maxLength={120}
                  placeholder="Lincoln High"
                  className="input"
                />
              </Field>
            </>
          )}

          <Field label="Email">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
            />
          </Field>

          {mode === "signin" && (
            <Link to="/forgot-password" className="self-end text-xs font-semibold text-primary">
              Forgot password?
            </Link>
          )}

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-5 py-4 text-sm font-semibold text-white shadow-glow transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
            {mode === "signup" ? "Create account" : "Sign in"}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setError(null); setMode(mode === "signup" ? "signin" : "signup"); }}
          className="mt-5 text-center text-xs font-semibold text-muted-foreground"
        >
          {mode === "signup" ? (
            <>Already have an account? <span className="text-primary">Sign in</span></>
          ) : (
            <>New here? <span className="text-primary">Create an account</span></>
          )}
        </button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
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
