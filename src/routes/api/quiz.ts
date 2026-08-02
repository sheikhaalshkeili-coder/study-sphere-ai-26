import { createFileRoute } from "@tanstack/react-router";

type QuizRequest = {
  material?: string;
  count?: number;
  subject?: string;
};

const SYSTEM_PROMPT = [
  "You write practice quizzes for a student using ONLY the study material they provide.",
  "Never invent facts that are not supported by the material.",
  "Mix multiple-choice, true/false and short-answer questions when the material allows it.",
  "Return strict JSON matching this shape:",
  '{"questions":[{"type":"multiple_choice"|"true_false"|"short_answer","question":string,"options":string[],"answer":string,"explanation":string}]}',
  "For multiple_choice give exactly 4 options and make `answer` exactly equal to one option.",
  "For true_false use options [\"True\",\"False\"].",
  "For short_answer use an empty options array and a concise answer of at most 8 words.",
  "Write plain sentences without markdown symbols.",
].join(" ");

export const Route = createFileRoute("/api/quiz")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("AI is not configured", { status: 500 });

        let body: QuizRequest;
        try {
          body = (await request.json()) as QuizRequest;
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        const material = (body.material ?? "").trim().slice(0, 24000);
        if (material.length < 20) {
          return new Response("Not enough study material", { status: 400 });
        }
        const count = Math.min(20, Math.max(5, Number(body.count) || 10));

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            reasoning_effort: "none",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                role: "user",
                content:
                  `Create exactly ${count} quiz questions${body.subject ? ` for the class "${body.subject}"` : ""} ` +
                  `from this study material. Respond with json only.\n\n${material}`,
              },
            ],
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Quiz gateway error [${upstream.status}]: ${detail}`);
          if (upstream.status === 429) return new Response("Rate limited — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
          return new Response("Couldn't generate the quiz", { status: 502 });
        }

        const json = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content ?? "";
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          return new Response("Couldn't read the generated quiz", { status: 502 });
        }

        return new Response(JSON.stringify(parsed), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
