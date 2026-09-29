import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceState = "idle" | "listening" | "transcribing" | "speaking";

/** Real voice I/O: records the mic, transcribes on the server, and plays server-generated speech. */
export function useVoice() {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const lastUrl = useRef<string | null>(null);
  const [canReplay, setCanReplay] = useState(false);

  const stopAudio = useCallback(() => {
    audio.current?.pause();
    audio.current = null;
    setState((s) => (s === "speaking" ? "idle" : s));
  }, []);

  useEffect(
    () => () => {
      recorder.current?.stream.getTracks().forEach((t) => t.stop());
      audio.current?.pause();
      if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    },
    [],
  );

  const startListening = useCallback(async () => {
    setError(null);
    stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.start();
      recorder.current = rec;
      setState("listening");
    } catch {
      setError("Microphone access is needed to talk to your tutor. Allow it in your browser settings.");
      setState("idle");
    }
  }, [stopAudio]);

  /** Stops recording and returns the transcript (empty string if nothing was heard). */
  const stopListening = useCallback(async (): Promise<string> => {
    const rec = recorder.current;
    if (!rec) return "";
    recorder.current = null;
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.stop();
    await done;
    rec.stream.getTracks().forEach((t) => t.stop());
    const blob = new Blob(chunks.current, { type: "audio/webm" });
    if (blob.size < 1000) {
      setState("idle");
      return "";
    }
    setState("transcribing");
    try {
      const form = new FormData();
      form.append("file", blob, "speech.webm");
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: form });
      if (!res.ok) throw new Error(await res.text());
      const { text } = (await res.json()) as { text: string };
      setState("idle");
      return text;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "I couldn't hear that — try again.");
      setState("idle");
      return "";
    }
  }, []);

  const playUrl = useCallback((url: string) => {
    return new Promise<void>((resolve) => {
      const el = new Audio(url);
      audio.current = el;
      setState("speaking");
      el.onended = () => {
        setState("idle");
        resolve();
      };
      el.onerror = () => {
        setState("idle");
        resolve();
      };
      el.play().catch(() => {
        setState("idle");
        resolve();
      });
    });
  }, []);

  /** Speaks text aloud; resolves when playback finishes. */
  const speak = useCallback(
    async (text: string) => {
      setError(null);
      setState("speaking");
      try {
        const res = await fetch("/api/voice/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = URL.createObjectURL(blob);
        setCanReplay(true);
        await playUrl(lastUrl.current);
      } catch (e) {
        setError(e instanceof Error && e.message ? e.message : "The tutor's voice is unavailable right now.");
        setState("idle");
      }
    },
    [playUrl],
  );

  const replay = useCallback(async () => {
    if (lastUrl.current) await playUrl(lastUrl.current);
  }, [playUrl]);

  const cancel = useCallback(() => {
    const rec = recorder.current;
    if (rec) {
      recorder.current = null;
      rec.onstop = null;
      rec.stop();
      rec.stream.getTracks().forEach((t) => t.stop());
    }
    stopAudio();
    setState("idle");
  }, [stopAudio]);

  return { state, error, setError, startListening, stopListening, speak, replay, canReplay, stopAudio, cancel };
}
