import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 12 * 1024 * 1024;

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return new Response("Voice is not configured", { status: 500 });
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES) return new Response("Recording is too long", { status: 413 });

        let file: File | null = null;
        try {
          const form = await request.formData();
          const f = form.get("file");
          if (f instanceof File) file = f;
        } catch {
          return new Response("Invalid upload", { status: 400 });
        }
        if (!file || !file.size) return new Response("No audio received", { status: 400 });
        if (file.size > MAX_BYTES) return new Response("Recording is too long", { status: 413 });

        const audio = new File([await file.arrayBuffer()], "speech.webm", {
          type: file.type.startsWith("audio/") ? file.type.split(";")[0] : "audio/webm",
        });
        const form = new FormData();
        form.append("model", "google/gemini-3.5-transcribe");
        form.append("file", audio, audio.name);
        form.append("response_format", "json");

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}` },
          body: form,
        });
        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          console.error(`Transcribe error [${upstream.status}]: ${detail}`);
          if (upstream.status === 429) return new Response("Too many requests — try again in a moment.", { status: 429 });
          if (upstream.status === 402) return new Response("AI credits exhausted.", { status: 402 });
          return new Response("I couldn't hear that clearly — please try again.", { status: upstream.status });
        }
        const json = (await upstream.json()) as { text?: string };
        return Response.json({ text: (json.text ?? "").trim() });
      },
    },
  },
});
