import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  Info,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useAssignments,
  useClasses,
  useExams,
  useFlashcards,
  useGrades,
  useNotes,
} from "@/hooks/use-study-data";
import {
  saveTutorMessage,
  useConversationMessages,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useUpdateConversation,
  type TutorMessage,
} from "@/hooks/use-tutor";

export const Route = createFileRoute("/app/tutor")({
  head: () => ({
    meta: [
      { title: "Tutor Me — StudySphere AI" },
      {
        name: "description",
        content: "A one-to-one AI tutor that teaches from your own classes, notes and flashcards.",
      },
      { property: "og:title", content: "Tutor Me — StudySphere AI" },
      {
        property: "og:description",
        content: "A one-to-one AI tutor that teaches from your own classes, notes and flashcards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TutorPage,
});

const PROMPTS = [
  "Explain this to me like I'm a beginner.",
  "Teach me this step by step.",
  "Quiz me on this topic.",
  "Give me a practice question.",
  "Explain where I went wrong.",
  "Help me understand this question without giving me the answer immediately.",
  "Make this easier to understand.",
  "Give me an example.",
  "Compare these two concepts.",
  "Help me prepare for my test.",
  "Create a 30-minute study plan.",
  "Turn my notes into flashcards.",
  "Test me on my notes.",
  "Summarize this topic.",
  "Ask me questions one at a time.",
  "Help me review what I got wrong.",
  "Explain this using a real-world example.",
  "Give me a harder question.",
  "Give me an easier question.",
  "Help me memorize this.",
];

function TutorPage() {
  const qc = useQueryClient();
  const { profile } = useProfile();
  const { data: classes = [] } = useClasses();
  const { data: notes = [] } = useNotes();
  const { data: flashcards = [] } = useFlashcards();
  const { data: assignments = [] } = useAssignments();
  const { data: exams = [] } = useExams();
  const { data: grades = [] } = useGrades();

  const { data: conversations = [] } = useConversations();
  const createConv = useCreateConversation();
  const updateConv = useUpdateConversation();
  const deleteConv = useDeleteConversation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const { data: history } = useConversationMessages(activeId);

  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const lastPrompt = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const classId = active?.class_id ?? "";

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    setMessages(history ?? []);
    setStreaming("");
    setError(null);
  }, [history, activeId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, pending]);

  /** Everything the tutor is allowed to treat as "the student's material" — all of it saved by them. */
  const context = useMemo(() => {
    const cls = classes.find((c) => c.id === classId) ?? null;
    const scoped = <T extends { class_id: string | null }>(rows: T[]) =>
      classId ? rows.filter((r) => r.class_id === classId) : rows;

    const parts: string[] = [];
    if (cls) parts.push(`Subject being studied: ${cls.subject}${cls.teacher ? ` (teacher ${cls.teacher})` : ""}.`);
    else if (classes.length) parts.push(`Classes: ${classes.map((c) => c.subject).join(", ")}.`);

    const n = scoped(notes).slice(0, 12);
    if (n.length) {
      parts.push(
        "Saved notes:\n" +
          n.map((x) => `- ${x.title}: ${(x.content ?? "").slice(0, 1200)}`).join("\n"),
      );
    }
    const f = scoped(flashcards).slice(0, 60);
    if (f.length) {
      parts.push("Saved flashcards:\n" + f.map((x) => `- Q: ${x.question} | A: ${x.answer}`).join("\n"));
    }
    const upcoming = scoped(assignments)
      .filter((a) => !a.done)
      .slice(0, 15);
    if (upcoming.length) {
      parts.push(
        "Open work:\n" +
          upcoming
            .map((a) => `- ${a.title} (${a.type}${a.due_at ? `, due ${new Date(a.due_at).toLocaleString()}` : ""})`)
            .join("\n"),
      );
    }
    const ex = scoped(exams).slice(0, 10);
    if (ex.length) {
      parts.push("Exams:\n" + ex.map((e) => `- ${e.title} on ${new Date(e.exam_at).toLocaleString()}`).join("\n"));
    }
    const g = scoped(grades).slice(0, 25);
    if (g.length) {
      parts.push("Recorded grades:\n" + g.map((x) => `- ${x.title} (${x.category}): ${x.score}/${x.max_score}`).join("\n"));
    }
    return parts.join("\n\n");
  }, [classes, classId, notes, flashcards, assignments, exams, grades]);

  const hasMaterial = context.trim().length > 0;

  async function ensureConversation(seedTitle: string) {
    if (activeId) return activeId;
    const created = await createConv.mutateAsync({ title: seedTitle });
    setActiveId(created.id);
    return created.id;
  }

  async function run(prompt: string, existing: TutorMessage[], conversationId: string) {
    setPending(true);
    setError(null);
    setStreaming("");
    lastPrompt.current = prompt;

    try {
      const res = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...existing, { role: "user", content: prompt }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          profile: profile
            ? `Name: ${profile.full_name || "student"}. Level: ${profile.education_level ?? "unknown"}. Year: ${profile.grade_year ?? "unknown"}. School: ${profile.school_name ?? "unknown"}.`
            : undefined,
          context,
        }),
      });

      if (!res.ok || !res.body) throw new Error(await res.text().catch(() => "The tutor is unavailable"));

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
            /* partial frame */
          }
        }
      }

      if (!full.trim()) throw new Error("Empty response");

      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: full }]);
      setStreaming("");
      await saveTutorMessage(conversationId, "assistant", full);
      qc.invalidateQueries({ queryKey: ["tutor_messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["tutor_conversations"] });
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
    const conversationId = await ensureConversation(t);
    const base = messages;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: t }]);
    setInput("");
    await saveTutorMessage(conversationId, "user", t);
    if (base.length === 0) await updateConv.mutateAsync({ id: conversationId, title: t });
    await run(t, base, conversationId);
  }

  async function retry() {
    if (!lastPrompt.current || !activeId) return;
    const base = messages.filter((m) => !(m.role === "user" && m.content === lastPrompt.current));
    await run(lastPrompt.current, base, activeId);
  }

  async function newConversation() {
    const created = await createConv.mutateAsync({ title: "New conversation" });
    setActiveId(created.id);
    setMessages([]);
    setShowList(false);
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-6">
      <div className="flex items-center gap-3">
        <Link
          to="/app/ai"
          aria-label="Back"
          className="grid size-10 place-items-center rounded-3xl border border-border bg-card shadow-soft active:scale-95"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display text-xl font-bold">Tutor Me</h1>
          <p className="text-xs text-muted-foreground">
            {active?.title && messages.length > 0 ? active.title : "Your personal AI tutor"}
          </p>
        </div>
        <button
          onClick={() => setShowList((v) => !v)}
          aria-label="Conversations"
          className="grid size-10 place-items-center rounded-3xl border border-border bg-card shadow-soft active:scale-95"
        >
          <GraduationCap className="size-4" />
        </button>
        <button
          onClick={newConversation}
          aria-label="New conversation"
          className="grid size-10 place-items-center rounded-3xl bg-gradient-brand text-white shadow-glow active:scale-95"
        >
          <MessageSquarePlus className="size-4" />
        </button>
      </div>

      {showList && (
        <div className="mt-4 space-y-2 rounded-3xl bg-card p-3 shadow-soft">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Conversations
          </p>
          {conversations.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              No conversations yet. Ask your first question below.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`flex items-center gap-2 rounded-3xl px-3 py-2.5 ${c.id === activeId ? "bg-accent" : "bg-muted/40"}`}
              >
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    setShowList(false);
                  }}
                  className="flex-1 truncate text-left text-sm font-medium"
                >
                  {c.title}
                </button>
                <button
                  onClick={() => {
                    deleteConv.mutate(c.id);
                    if (c.id === activeId) {
                      setActiveId(null);
                      setMessages([]);
                    }
                  }}
                  aria-label={`Delete ${c.title}`}
                  className="grid size-8 place-items-center rounded-full text-muted-foreground active:scale-95"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Subject picker — the tutor only sees material from the chosen class */}
      <div className="mt-4">
        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          What are you studying?
        </label>
        {classes.length === 0 ? (
          <Link
            to="/app/classes"
            className="block rounded-3xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground"
          >
            Add your classes so the tutor knows your subjects.
          </Link>
        ) : (
          <select
            value={classId}
            onChange={async (e) => {
              const id = await ensureConversation("New conversation");
              updateConv.mutate({ id, class_id: e.target.value });
            }}
            className="input"
          >
            <option value="">All my subjects</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.subject}
              </option>
            ))}
          </select>
        )}
        {!hasMaterial && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            No saved notes or flashcards yet — the tutor will work from what you type here.
          </p>
        )}
      </div>

      <div className="mt-5 flex-1 space-y-4">
        {messages.length === 0 && !pending ? (
          <div>
            <div className="rounded-3xl bg-gradient-soft p-5">
              <p className="text-sm leading-relaxed">
                I'm your tutor. Tell me what you're working on and I'll teach it step by step, quiz you, or help you
                see where you went wrong.
              </p>
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try asking</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full bg-card px-3.5 py-2 text-xs font-medium shadow-soft active:scale-95"
                >
                  {p}
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
            {messages.length > 0 && !pending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {["Ask me a question about this.", "Make this easier to understand.", "Give me a harder question.", "Quiz me on this topic."].map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-medium shadow-soft active:scale-95"
                    >
                      {p}
                    </button>
                  ),
                )}
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
            placeholder="Ask your tutor anything..."
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
