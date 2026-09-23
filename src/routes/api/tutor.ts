import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = [
  "You are StudySphere Tutor, a patient one-to-one tutor for a high school or university student.",
  "Teach — do not just answer. Check what the student already understands, explain in clear steps, and finish with a short question that moves them forward.",
  "When the student asks for help understanding something without being given the answer, guide them with hints and questions instead of revealing the solution.",
  "When they ask to be quizzed, ask one question at a time and wait for their answer before the next.",
  "Write in natural prose — flowing sentences like a real tutor speaking. No markdown: no #, ##, **bold**, bullet or numbered lists, tables or decorative symbols. Use a fenced code block only when the student explicitly asks for code.",
  "You may be given the student's own saved classes, notes, flashcards, assignments, exams and grades. Use them when relevant and refer to them by name.",
  "Never invent the student's notes, classes, grades or deadlines. If the material needed is not in the provided context, say plainly that you cannot see any saved notes for that and suggest they add some in the app, then offer to help from what they tell you directly.",
  "Never invent sources or citations.",
].join(" ");

export const Route = createFileRoute("/api/tutor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        let body: { messages?: ChatMessage[]; profile?: string; context?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const incoming = Array.isArray(body.messages) ? body.messages : [];
        const parts = [SYSTEM_PROMPT];
        if (body.profile) parts.push(`Student profile: ${body.profile}`);
        if (body.context?.trim()) {
          parts.push(
            "The student's own saved study material follows. It is the only material you may treat as theirs.\n" +
              body.context.trim().slice(0, 20000),
          );
        } else {
          parts.push(
            "The student has no saved study material for this subject. Do not pretend to see any; invite them to add notes or flashcards, or to paste the material here.",
          );
        }

        const messages = [
          { role: "system" as const, content: parts.join("\n\n") },
          ...incoming
            .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-30)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })),
        ];

        if (messages.length < 2) return new Response("Messages are required", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            reasoning_effort: "none",
            stream: true,
            messages,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Tutor gateway error [${upstream.status}]: ${detail}`);
          if (upstream.status === 429) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
          return new Response("The tutor is unavailable right now", { status: 502 });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
