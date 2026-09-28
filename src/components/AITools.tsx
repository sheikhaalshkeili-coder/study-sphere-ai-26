import { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useClasses, useFlashcards, useNotes, useSaveFlashcardsBulk } from "@/hooks/use-study-data";

const TOOLS = [
  { id: "flashcards", label: "Flashcards" },
  { id: "summary", label: "Summarise notes" },
  { id: "plan", label: "Study plan" },
  { id: "brainstorm", label: "Essay ideas" },
  { id: "practice", label: "Practice questions" },
] as const;
type ToolId = (typeof TOOLS)[number]["id"];

/** AI study tools that work only from the student's saved notes/cards or text they paste. */
export function AITools() {
  const { data: classes = [] } = useClasses();
  const { data: notes = [] } = useNotes();
  const { data: cards = [] } = useFlashcards();
  const saveBulk = useSaveFlashcardsBulk();

  const [tool, setTool] = useState<ToolId>("flashcards");
  const [classId, setClassId] = useState("");
  const [extra, setExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [generated, setGenerated] = useState<{ question: string; answer: string }[]>([]);
  const [saved, setSaved] = useState(false);

  const saved_material = useMemo(() => {
    if (!classId) return "";
    const n = notes.filter((x) => x.class_id === classId).map((x) => `${x.title}\n${x.content}`);
    const f = cards.filter((x) => x.class_id === classId).map((x) => `Q: ${x.question} A: ${x.answer}`);
    return [...n, ...f].join("\n\n");
  }, [classId, notes, cards]);

  const material = [saved_material, extra.trim()].filter(Boolean).join("\n\n");
  const subject = classes.find((c) => c.id === classId)?.subject;

  async function run() {
    setLoading(true); setError(null); setText(""); setGenerated([]); setSaved(false);
    try {
      const res = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, material, subject }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Something went wrong");
      const data = (await res.json()) as { text?: string; cards?: { question: string; answer: string }[] };
      if (tool === "flashcards") {
        if (!data.cards?.length) throw new Error("No flashcards could be made from that material.");
        setGenerated(data.cards);
      } else setText(data.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTool(t.id); setText(""); setGenerated([]); setError(null); }}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold shadow-soft active:scale-95 ${
              tool === t.id ? "bg-foreground text-background" : "bg-card text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <select
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        aria-label="Use material from class"
        className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
      >
        <option value="">No class — use only the text below</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.subject}</option>)}
      </select>
      {classId && !saved_material && (
        <p className="text-xs text-muted-foreground">You have no notes or flashcards saved for this class yet. Paste some text below, or add notes first.</p>
      )}
      {classId && saved_material && (
        <p className="text-xs text-muted-foreground">Using your saved notes and flashcards for {subject}.</p>
      )}

      <textarea
        value={extra}
        onChange={(e) => setExtra(e.target.value)}
        rows={4}
        placeholder={tool === "plan" ? "Your exams, deadlines and how much time you have each day" : tool === "brainstorm" ? "Your essay question or topic" : "Paste extra notes or a topic (optional if a class is chosen)"}
        className="w-full rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
      />

      <button
        disabled={loading || material.length < 20}
        onClick={run}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-white shadow-glow disabled:opacity-40"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Working…" : "Generate"}
      </button>

      {error && (
        <div className="rounded-3xl bg-destructive/10 p-4 text-sm text-destructive">
          {error} <button onClick={run} className="ml-1 font-semibold underline">Retry</button>
        </div>
      )}

      {text && (
        <div className="whitespace-pre-wrap rounded-3xl bg-card p-4 text-sm leading-relaxed shadow-soft">{text}</div>
      )}

      {generated.length > 0 && (
        <div className="space-y-2">
          {generated.map((c, i) => (
            <div key={i} className="rounded-3xl bg-card p-4 shadow-soft">
              <p className="text-sm font-semibold">{c.question}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.answer}</p>
            </div>
          ))}
          <button
            disabled={saved || saveBulk.isPending}
            onClick={async () => {
              await saveBulk.mutateAsync({ cards: generated, class_id: classId || null, topic: subject ?? null });
              setSaved(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-card py-3 text-sm font-semibold shadow-soft disabled:opacity-50"
          >
            <Save className="size-4" /> {saved ? "Saved to your flashcards" : "Save to my account"}
          </button>
        </div>
      )}

      {(text || generated.length > 0) && (
        <p className="text-center text-[11px] text-muted-foreground">AI responses may contain mistakes — double check important facts.</p>
      )}
    </div>
  );
}
