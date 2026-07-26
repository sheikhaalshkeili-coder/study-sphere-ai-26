export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const CLASS_COLORS: { name: string; value: string }[] = [
  { name: "blue", value: "oklch(0.65 0.18 250)" },
  { name: "purple", value: "oklch(0.6 0.2 285)" },
  { name: "pink", value: "oklch(0.62 0.21 340)" },
  { name: "green", value: "oklch(0.7 0.15 155)" },
  { name: "orange", value: "oklch(0.7 0.17 55)" },
  { name: "teal", value: "oklch(0.68 0.13 200)" },
];

export function colorOf(name: string | null | undefined) {
  return CLASS_COLORS.find((c) => c.name === name)?.value ?? CLASS_COLORS[0].value;
}

export const TASK_TYPES = ["assignment", "homework", "quiz", "project"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export type Bucket = "Today" | "Tomorrow" | "This Week" | "Overdue";
export const BUCKETS: Bucket[] = ["Today", "Tomorrow", "This Week", "Overdue"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Days from today (0 = today, 1 = tomorrow, -1 = yesterday). */
export function dayOffset(iso: string, now = new Date()) {
  const diff = startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime();
  return Math.round(diff / 86400000);
}

export function bucketFor(iso: string | null, done: boolean, now = new Date()): Bucket | null {
  if (!iso) return null;
  const off = dayOffset(iso, now);
  if (off < 0) return done ? "This Week" : "Overdue";
  if (off === 0) return "Today";
  if (off === 1) return "Tomorrow";
  if (off <= 7) return "This Week";
  return null;
}

export function formatDue(iso: string | null) {
  if (!iso) return "No due date";
  const d = new Date(iso);
  const off = dayOffset(iso);
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (off === 0) return `Today ${time}`;
  if (off === 1) return `Tomorrow ${time}`;
  if (off === -1) return `Yesterday ${time}`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ` · ${time}`;
}

export function formatTime(t: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Converts a datetime-local value to an ISO string, and back. */
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export function startOfWeek(now = new Date()) {
  const d = startOfDay(now);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function endOfWeek(now = new Date()) {
  const d = startOfWeek(now);
  d.setDate(d.getDate() + 7);
  return d;
}
