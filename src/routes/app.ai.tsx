import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, Sparkles, BookOpen, ListChecks, FileText, Lightbulb, Brain } from "lucide-react";

export const Route = createFileRoute("/app/ai")({
  component: AIChat,
});

type Msg = { role: "user" | "assistant"; text: string };

const starters = [
  { icon: Lightbulb, text: "Explain this topic simply" },
  { icon: ListChecks, text: "Quiz me on this chapter" },
  { icon: FileText, text: "Summarize my notes" },
  { icon: BookOpen, text: "Make flashcards" },
  { icon: Brain, text: "Help me study for tomorrow's test" },
];

function AIChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [
      ...m,
      { role: "user", text: t },
      { role: "assistant", text: mockReply(t) },
    ]);
    setInput("");
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
          <Sparkles className="size-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold">AI Study Assistant</h1>
          <p className="text-xs text-muted-foreground">Powered by StudySphere AI</p>
        </div>
      </div>

      {/* Chat area */}
      <div className="mt-6 flex-1 space-y-4">
        {messages.length === 0 ? (
          <div>
            <div className="rounded-3xl bg-gradient-soft p-5">
              <p className="text-sm leading-relaxed">
                Hi Alex! 👋 I can help with homework, explain concepts, generate flashcards, quiz you, or build a study plan. What would you like to work on?
              </p>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try one of these</p>
            <div className="mt-3 space-y-2">
              {starters.map((s) => (
                <button
                  key={s.text}
                  onClick={() => send(s.text)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left shadow-soft active:scale-[0.98]"
                >
                  <div className="grid size-9 place-items-center rounded-xl bg-accent">
                    <s.icon className="size-4 text-primary" />
                  </div>
                  <span className="flex-1 text-sm font-medium">{s.text}</span>
                  <Send className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-3xl rounded-br-md bg-gradient-brand px-4 py-3 text-sm text-white shadow-soft"
                    : "max-w-[90%] rounded-3xl rounded-bl-md bg-card px-4 py-3 text-sm shadow-soft"
                }
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Composer */}
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
            className="grid size-10 place-items-center rounded-full bg-gradient-brand text-white shadow-glow active:scale-95"
          >
            <Send className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function mockReply(t: string) {
  const lower = t.toLowerCase();
  if (lower.includes("flashcard")) return "Great — I've drafted 12 flashcards from your latest notes. Open the Study tab to review them.";
  if (lower.includes("quiz")) return "Ready! I generated a 10-question quiz mixing multiple choice and short answer. Tap Start when you're ready.";
  if (lower.includes("summarize") || lower.includes("summary")) return "Here's the gist:\n\n• Key concept 1 — the main driver of the phenomenon\n• Key concept 2 — how it applies in context\n• Key concept 3 — the exception you'll be tested on\n\nWant deeper detail on any of these?";
  if (lower.includes("study plan") || lower.includes("study for")) return "Here's a 3-day plan:\n\nDay 1 — Review chapters 4-6, do practice set A\nDay 2 — Flashcards + weak spots\nDay 3 — Full mock quiz + rest\n\nAdd it to your planner?";
  return "Got it. Let's break this down step by step so it actually clicks. What part are you stuck on?";
}
