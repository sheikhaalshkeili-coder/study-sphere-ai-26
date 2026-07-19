import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, Sparkles, BookOpen, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});


type Tab = {
  to: "/app" | "/app/planner" | "/app/ai" | "/app/study" | "/app/profile";
  label: string;
  icon: typeof Home;
  exact?: boolean;
  primary?: boolean;
};

const tabs: Tab[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/planner", label: "Planner", icon: CalendarDays },
  { to: "/app/ai", label: "AI", icon: Sparkles, primary: true },
  { to: "/app/study", label: "Study", icon: BookOpen },
  { to: "/app/profile", label: "Profile", icon: User },
];

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md pb-28">
        <Outlet />
      </div>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-2">
        <div className="glass flex w-full max-w-md items-center justify-around rounded-full px-2 py-2 shadow-soft">
          {tabs.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            const Icon = t.icon;
            if (t.primary) {
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="-mt-6 grid size-14 place-items-center rounded-full bg-gradient-brand text-white shadow-glow transition active:scale-95"
                  aria-label={t.label}
                >
                  <Icon className="size-6" strokeWidth={2.4} />
                </Link>
              );
            }
            return (
              <Link
                key={t.to}
                to={t.to}
                className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition"
              >
                <Icon
                  className={`size-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={active ? "text-primary" : "text-muted-foreground"}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
