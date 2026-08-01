import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Sparkles, BookOpen, ListChecks, FileText, Lightbulb, Brain, RefreshCw, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/ai")({
  head: () => ({
    meta: [
      { title: "AI Study Assistant — StudySphere" },
      { name: "description", content: "Ask questions, get explanations, quizzes and study plans from your AI study assistant." },
      { property: "og:title", content: "AI Study Assistant — StudySphere" },
      { property: "og:description", content: "Ask questions, get explanations, quizzes and study plans from your AI study assistant." },
    ],
  }),
  component: AIChat,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

const starters = [
  { icon: Lightbulb, text: "Explain this topic simply" },
  { icon: ListChecks, text: "Quiz me on this chapter" },
  { icon: FileText, text: "Summarize my notes" },
  { icon: BookOpen, text: "Make flashcards" },
  { icon: Brain, text: "Help me study for tomorrow's test" },
];

function AIChat() {
  const { profile } = useProfile();
  const qc = useQueryClient();
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const { data: history } = useQuery({
    queryKey: ["chat_messages"],
    queryFn: async (): Promise<Msg[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Msg[];
    },
  });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const lastPrompt = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, pending]);

  async function persist(role: "user" | "assistant", content: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.from("chat_messages").insert({ user_id: userData.user.id, role, content });
  }

  async function run(prompt: string, existing: Msg[]) {
    setPending(true);
    setError(null);
    setStreaming("");
    lastPrompt.current = prompt;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...existing, { role: "user", content: prompt }].map((m) => ({
            role: "role" in m ? m.role : "user",
            content: m.content,
          })),
          profile: profile
            ? `Name: ${profile.full_name || "student"}. Level: ${profile.education_level ?? "unknown"}. Year: ${profile.grade_year ?? "unknown"}. School: ${profile.school_name ?? "unknown"}.`
            : undefined,
        }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "AI request failed"));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta: string | undefined = json.choices?.[0]?.delta?.content;
            if (delta) {
              full += delta;
              setStreaming(full);
            }
          } catch {
            /* ignore partial frames */
          }
        }
      }

      if (!full.trim()) throw new Error("Empty response");

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: full }]);
      setStreaming("");
      await persist("assistant", full);
      qc.invalidateQueries({ queryKey: ["chat_messages"] });
    } catch {
      setStreaming("");
      setError("Something went wrong — try again");
    } finally {
      setPending(false);
    }
  }

  async function send(text: string) {
    const t = text.trim();
    if (!t || pending) return;
    const base = messages;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: t }]);
    setInput("");
    void persist("user", t);
    await run(t, base);
  }

  async function retry() {
    if (!lastPrompt.current) return;
    const base = messages.filter((m) => m.content !== lastPrompt.current || m.role !== "user");
    await run(lastPrompt.current, base);
  }

  async function clearChat() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error: delError } = await supabase.from("chat_messages").delete().eq("user_id", userData.user.id);
    if (delError) {
      toast.error("Couldn't clear the chat");
      return;
    }
    setMessages([]);
    setError(null);
    qc.invalidateQueries({ queryKey: ["chat_messages"] });
    toast.success("Chat cleared");
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-3xl bg-gradient-brand shadow-glow">
          <Sparkles className="size-5 text-white" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold">AI Study Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by StudySphere AI</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            aria-label="Clear chat"
            className="grid size-10 place-items-center rounded-3xl border border-border bg-card shadow-soft active:scale-95"
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="mt-6 flex-1 space-y-4">
        {messages.length === 0 && !pending ? (
          <div>
            <div className="rounded-3xl bg-gradient-soft p-5">
              <p className="text-sm leading-relaxed">
                Hi {firstName}! 👋 I can help with homework, explain concepts, generate flashcards, quiz you, or build a study plan. What would you like to work on?
              </p>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try one of these</p>
            <div className="mt-3 space-y-2">
              {starters.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-card p-3.5 text-left shadow-soft active:scale-[0.98]"
                >
                  <div className="grid size-9 place-items-center rounded-3xl bg-accent">
                    <s.icon className="size-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{s.text}</span>
                  <Send className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {streaming && <Bubble role="assistant" content={streaming} />}
            {pending && !streaming && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-md bg-card px-4 py-3.5 shadow-soft">
                  <div className="flex gap-1.5">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="size-2 animate-bounce rounded-full bg-muted-foreground/50"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-3 rounded-3xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="flex-1 text-xs font-medium text-destructive">{error}</p>
                <button
                  onClick={retry}
                  className="flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground active:scale-95"
                >
                  <RefreshCw className="size-3.5" /> Retry
                </button>
              </div>
            )}
          </>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 mt-4 pb-2">
        <div className="glass flex items-center gap-2 rounded-full p-1.5 shadow-soft">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => send(input)}
            disabled={pending || !input.trim()}
            aria-label="Send message"
            className="grid size-10 place-items-center rounded-full bg-gradient-brand text-white shadow-glow transition active:scale-95 disabled:opacity-40"
          >
            <Send className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-md bg-gradient-brand px-4 py-3 text-sm text-white shadow-soft">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <div className="max-w-[90%] whitespace-pre-wrap rounded-3xl rounded-bl-md bg-card px-4 py-3 text-sm shadow-soft">
        {content}
      </div>
      <p className="mt-1.5 flex items-center gap-1 pl-1 text-[10px] text-muted-foreground">
        <Info className="size-3" /> AI responses may contain mistakes — double check important facts.
      </p>
    </div>
  );
}
