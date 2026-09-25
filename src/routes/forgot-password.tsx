import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — StudySphere AI" },
      { name: "description", content: "Send yourself a link to choose a new StudySphere AI password." },
      { property: "og:title", content: "Reset your password — StudySphere AI" },
      { property: "og:description", content: "Send yourself a link to choose a new StudySphere AI password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-8">
      <Link
        to="/auth"
        aria-label="Back to sign in"
        className="grid size-10 place-items-center rounded-3xl border border-border bg-card shadow-soft active:scale-95"
      >
        <ArrowLeft className="size-4" />
      </Link>

      <div className="mt-8">
        <div className="grid size-12 place-items-center rounded-3xl bg-gradient-brand shadow-glow">
          <Mail className="size-5 text-white" strokeWidth={2.5} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">Forgot your password?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send you a link to choose a new one.
        </p>
      </div>

      {sent ? (
        <div className="mt-8 rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            If an account exists for {email.trim()}, a reset link is on its way. The link opens a page where you set a new
            password.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-flex rounded-full bg-gradient-brand px-4 py-2 text-xs font-semibold text-white shadow-glow"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8">
          <label className="block text-xs font-semibold">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="mt-5 w-full rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
