import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT =
  "You are StudySphere AI, a friendly study assistant for high school and university students. " +
  "Explain concepts clearly and step by step, use short paragraphs and bullet points, and never invent sources or citations. " +
  "If you are unsure, say so. Keep answers concise unless the student asks for depth.";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        let body: { messages?: ChatMessage[]; profile?: string };
        try {
          body = (await request.json()) as { messages?: ChatMessage[]; profile?: string };
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const incoming = Array.isArray(body.messages) ? body.messages : [];
        const messages: ChatMessage[] = [
          {
            role: "system",
            content: body.profile ? `${SYSTEM_PROMPT}\n\nStudent context: ${body.profile}` : SYSTEM_PROMPT,
          },
          ...incoming
            .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-24)
            .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) })),
        ];

        if (messages.length < 2) return new Response("Messages are required", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            reasoning_effort: "none",
            stream: true,
            messages,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error(`AI gateway error [${upstream.status}]: ${detail}`);
          if (upstream.status === 429) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
          return new Response("AI request failed", { status: 502 });
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
