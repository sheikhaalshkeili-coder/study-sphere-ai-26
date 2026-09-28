import { createFileRoute } from "@tanstack/react-router";

const TOOLS = {
  flashcards:
    "Create study flashcards from the material. Return ONLY JSON: {\"cards\":[{\"question\":\"...\",\"answer\":\"...\"}]} with between 5 and 15 cards. Answers short and precise.",
  summary:
    "Summarise the material for a student revising it. Plain prose paragraphs, no markdown symbols. Cover the key ideas, definitions and anything likely to be tested.",
  plan:
    "Write a realistic study plan using only the material and details given (deadlines, exams, time available). Plain text, one session per line in the form 'Day — minutes — what to do'. Do not invent exams or deadlines.",
  brainstorm:
    "Help the student brainstorm an essay on the given topic or material: possible thesis statements, main arguments, counterarguments and evidence to look for. Plain text, no markdown symbols. Do not write the essay.",
  practice:
    "Write 5 practice questions based only on the material, increasing in difficulty, followed by a separate 'Answers' section with brief worked answers. Plain text, no markdown symbols.",
} as const;

type Tool = keyof typeof TOOLS;

export const Route = createFileRoute("/api/tools")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });
        let body: { tool?: string; material?: string; subject?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }
        const tool = body.tool as Tool;
        if (!tool || !(tool in TOOLS)) return new Response("Unknown tool", { status: 400 });
        const material = (body.material ?? "").trim().slice(0, 24000);
        if (material.length < 20) return new Response("Add some notes or text first", { status: 400 });

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            reasoning_effort: "none",
            ...(tool === "flashcards" ? { response_format: { type: "json_object" } } : {}),
            messages: [
              {
                role: "system",
                content: `You are a study assistant. Use only the student's material below; never invent facts about their course, grades or deadlines. ${TOOLS[tool]}`,
              },
              { role: "user", content: `${body.subject ? `Subject: ${body.subject}\n\n` : ""}Material:\n${material}` },
            ],
          }),
        });
        if (!upstream.ok) {
          console.error(`Tools gateway error [${upstream.status}]: ${await upstream.text().catch(() => "")}`);
          if (upstream.status === 429) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
          return new Response("The AI tool is unavailable right now", { status: 502 });
        }
        const json = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content ?? "";
        if (tool === "flashcards") {
          try {
            const parsed = JSON.parse(text) as { cards?: { question?: string; answer?: string }[] };
            const cards = (parsed.cards ?? [])
              .filter((c) => c.question && c.answer)
              .map((c) => ({ question: String(c.question), answer: String(c.answer) }));
            return Response.json({ cards });
          } catch {
            return new Response("The AI returned an unreadable result — try again.", { status: 502 });
          }
        }
        return Response.json({ text });
      },
    },
  },
});
