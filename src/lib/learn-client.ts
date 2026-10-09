import JSZip from "jszip";
import { supabase } from "@/integrations/supabase/client";

export const OFF_TOPIC = "Let's keep this focused on your classwork. Try asking a question about the topic you're studying.";

export async function learnApi<T>(action: string, payload: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const res = await fetch("/api/learn", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify({ action, ...payload }),
    signal,
  });
  const j = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(j.error || "Something went wrong. Please try again.");
  return j;
}

export type Material = { kind: "file" | "paste" | "youtube"; name: string; text: string };

function toDataUrl(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(new Error("Couldn't read that file"));
    r.readAsDataURL(f);
  });
}

async function officeText(f: File, kind: "docx" | "pptx") {
  const zip = await JSZip.loadAsync(await f.arrayBuffer());
  const names = Object.keys(zip.files)
    .filter((n) => (kind === "docx" ? /^word\/(document|footnotes)\.xml$/.test(n) : /^ppt\/slides\/slide\d+\.xml$/.test(n)))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0));
  const parts: string[] = [];
  for (const n of names) {
    const xml = await zip.files[n].async("string");
    const paras = xml.split(/<\/(?:w|a):p>/).map((p) => [...p.matchAll(/<(?:w|a):t[^>]*>([^<]*)<\/(?:w|a):t>/g)].map((m) => m[1]).join(""));
    parts.push((kind === "pptx" ? `Slide ${parts.length + 1}:\n` : "") + paras.filter(Boolean).join("\n"));
  }
  return parts.join("\n\n").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

export const ACCEPT = ".pdf,.docx,.pptx,.txt,.md,image/png,image/jpeg,image/webp";

/** Reads an uploaded file into study text — really reads it, or throws. */
export async function readMaterialFile(f: File): Promise<Material> {
  if (f.size > 10 * 1024 * 1024) throw new Error(`${f.name} is larger than 10 MB.`);
  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
  let text = "";
  if (ext === "txt" || ext === "md") text = await f.text();
  else if (ext === "docx" || ext === "pptx") text = await officeText(f, ext);
  else if (ext === "pdf" || f.type.startsWith("image/")) {
    const r = await learnApi<{ text: string }>("extract", { kind: ext === "pdf" ? "pdf" : "image", name: f.name, data: await toDataUrl(f) });
    text = r.text;
  } else throw new Error(`${f.name}: use PDF, Word (.docx), PowerPoint (.pptx), an image or a text file.`);
  if (!text.trim()) throw new Error(`No readable text was found in ${f.name}.`);
  return { kind: "file", name: f.name, text: text.trim() };
}
