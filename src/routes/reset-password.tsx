import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Choose a new password — StudySphere AI" },
      { name: "description", content: "Set a new password for your StudySphere AI account." },
      { property: "og:title", content: "Choose a new password — StudySphere AI" },
      { property: "og:description", content: "Set a new password for your StudySphere AI account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const valid = password.length >= 6 && password === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/app", replace: true });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-16">
      <div className="grid size-12 place-items-center rounded-3xl bg-gradient-brand shadow-glow">
        <KeyRound className="size-5 text-white" strokeWidth={2.5} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {ready
          ? "Pick something you'll remember — at least 6 characters."
          : "Open this page from the reset link in your email to continue."}
      </p>

      <form onSubmit={submit} className="mt-8">
        <label className="block text-xs font-semibold">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={!ready}
          className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        <label className="mt-3 block text-xs font-semibold">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={!ready}
          className="mt-1 w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary disabled:opacity-60"
        />
        {confirm.length > 0 && password !== confirm && (
          <p className="mt-2 text-xs text-destructive">Those passwords don't match.</p>
        )}
        <button
          type="submit"
          disabled={!ready || !valid || busy}
          className="mt-5 w-full rounded-full bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
