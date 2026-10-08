// Server-only helpers for the Learn page: streamed Lovable AI Gateway calls, accumulated server-side.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class GatewayError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function friendly(status: number, detail: string) {
  if (status === 429) return "Lots of students are learning right now — try again in a moment.";
  if (status === 402) return "AI credits have run out for this app. Add credits to keep learning.";
  if (status === 403) return detail.slice(0, 300) || "AI access is not available right now.";
  if (status === 400) return "That material couldn't be read. Try a smaller or different file.";
  return "The AI couldn't respond right now. Please try again.";
}

/** Streams a chat completion and returns the full text. */
export async function streamCompletion(body: Record<string, unknown>, signal?: AbortSignal): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new GatewayError(500, "AI is not configured.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    console.error(`Learn gateway error [${res.status}]: ${detail}`);
    throw new GatewayError(res.status, friendly(res.status, detail));
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[]; error?: { message?: string } };
        if (j.error) throw new GatewayError(502, j.error.message || "The AI stopped unexpectedly.");
        out += j.choices?.[0]?.delta?.content ?? "";
      } catch (e) {
        if (e instanceof GatewayError) throw e;
      }
    }
  }
  return out;
}

/** Structured JSON call on the default text model. */
export async function jsonCall<T>(system: string, user: string, name: string, schema: object, signal?: AbortSignal): Promise<T> {
  const text = await streamCompletion(
    {
      model: "openai/gpt-6-astra",
      reasoning_effort: "low",
      response_format: { type: "json_schema", json_schema: { name, strict: true, schema } },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    signal,
  );
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new GatewayError(502, "The AI reply couldn't be read. Please try again.");
  }
}

/** Reads a PDF or image and returns its study text. */
export async function extractFileText(kind: "pdf" | "image", name: string, dataUrl: string, signal?: AbortSignal) {
  const part =
    kind === "pdf"
      ? { type: "file", file: { filename: name, file_data: dataUrl } }
      : { type: "image_url", image_url: { url: dataUrl } };
  return streamCompletion(
    {
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe all the study content from this file as plain text: headings, paragraphs, bullet points, tables (as lines), questions, formulas and labelled diagram text. Do not add anything that is not in the file. If there is no readable study content, reply with exactly: NO_CONTENT",
            },
            part,
          ],
        },
      ],
    },
    signal,
  );
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

export function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Fetches a YouTube video's title and caption transcript when YouTube makes it available. */
export async function fetchYoutube(url: string) {
  const id = youtubeId(url);
  if (!id) throw new GatewayError(400, "That doesn't look like a YouTube video link.");
  let title = "";
  const o = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`).catch(() => null);
  if (!o || !o.ok) throw new GatewayError(404, "That video couldn't be found or is private.");
  title = ((await o.json()) as { title?: string }).title ?? "";

  let transcript = "";
  try {
    const page = await fetch(`https://www.youtube.com/watch?v=${id}&hl=en`, {
      headers: { "Accept-Language": "en-US,en;q=0.9", "User-Agent": "Mozilla/5.0" },
    });
    const html = await page.text();
    const m = html.match(/"captionTracks":(\[.*?\])/);
    if (m) {
      const tracks = JSON.parse(m[1]) as { baseUrl: string; languageCode?: string }[];
      const track = tracks.find((t) => t.languageCode?.startsWith("en")) ?? tracks[0];
      if (track) {
        const xml = await (await fetch(track.baseUrl.replace(/\\u0026/g, "&"))).text();
        transcript = decodeEntities(
          [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((x) => x[1].replace(/<[^>]+>/g, "")).join(" "),
        ).replace(/\s+/g, " ").trim();
      }
    }
  } catch (e) {
    console.error("YouTube transcript fetch failed", e);
  }
  return { id, title, transcript };
}
