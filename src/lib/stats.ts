import type { AssignmentRow, FlashcardRow, GradeRow, NoteRow, StudySessionRow } from "@/hooks/use-study-data";

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function keyForOffset(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Consecutive days (counting back from today) with at least one completed
 * assignment or a logged study session. Purely derived from saved rows.
 */
export function computeStreak(sessions: StudySessionRow[], assignments: AssignmentRow[]) {
  const active = new Set<string>();
  sessions.forEach((s) => active.add(dayKey(s.started_at)));
  assignments.filter((a) => a.done && a.due_at).forEach((a) => active.add(dayKey(a.due_at as string)));

  let streak = 0;
  // today may not have activity yet — start from yesterday in that case
  const start = active.has(keyForOffset(0)) ? 0 : 1;
  if (start === 1 && !active.has(keyForOffset(1))) return 0;
  for (let i = start; i < 365; i++) {
    if (!active.has(keyForOffset(i))) break;
    streak++;
  }
  return streak;
}

export function minutesInLastDays(sessions: StudySessionRow[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  return sessions
    .filter((s) => new Date(s.started_at).getTime() >= cutoff)
    .reduce((sum, s) => sum + (s.minutes || 0), 0);
}

export function minutesPerDay(sessions: StudySessionRow[], days = 7) {
  const out: { label: string; minutes: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const minutes = sessions
      .filter((s) => dayKey(s.started_at) === key)
      .reduce((sum, s) => sum + (s.minutes || 0), 0);
    out.push({ label: d.toLocaleDateString("en-US", { weekday: "narrow" }), minutes });
  }
  return out;
}

export type Achievement = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  progress: string;
};

export function computeAchievements(input: {
  assignments: AssignmentRow[];
  sessions: StudySessionRow[];
  flashcards: FlashcardRow[];
  notes: NoteRow[];
  grades: GradeRow[];
  streak: number;
}): Achievement[] {
  const done = input.assignments.filter((a) => a.done).length;
  return [
    {
      id: "first-task",
      label: "First task done",
      description: "Complete your first assignment",
      earned: done >= 1,
      progress: `${Math.min(done, 1)}/1`,
    },
    {
      id: "ten-tasks",
      label: "Ten down",
      description: "Complete 10 assignments",
      earned: done >= 10,
      progress: `${Math.min(done, 10)}/10`,
    },
    {
      id: "first-session",
      label: "First study session",
      description: "Finish one timed study session",
      earned: input.sessions.length >= 1,
      progress: `${Math.min(input.sessions.length, 1)}/1`,
    },
    {
      id: "first-deck",
      label: "First flashcards",
      description: "Create 5 flashcards",
      earned: input.flashcards.length >= 5,
      progress: `${Math.min(input.flashcards.length, 5)}/5`,
    },
    {
      id: "note-taker",
      label: "Note taker",
      description: "Write 3 sets of notes",
      earned: input.notes.length >= 3,
      progress: `${Math.min(input.notes.length, 3)}/3`,
    },
    {
      id: "week-streak",
      label: "Seven day streak",
      description: "Stay active 7 days in a row",
      earned: input.streak >= 7,
      progress: `${Math.min(input.streak, 7)}/7`,
    },
    {
      id: "graded",
      label: "Tracking grades",
      description: "Record 5 graded assessments",
      earned: input.grades.length >= 5,
      progress: `${Math.min(input.grades.length, 5)}/5`,
    },
  ];
}

const MOTIVATION = [
  "Small daily improvements are the key to staggering long-term results.",
  "You don't have to be perfect today — just a little further than yesterday.",
  "Focus beats hours. Twenty-five honest minutes counts.",
  "Understanding beats memorising. Ask why one more time.",
  "Start with the hardest thing while your mind is fresh.",
  "Revision is not re-reading. Test yourself instead.",
  "Progress you can't see today still adds up.",
];

/** Same message all day, different message tomorrow — no randomness on render. */
export function motivationForToday(now = new Date()) {
  const dayNumber = Math.floor(now.getTime() / 86400000);
  return MOTIVATION[dayNumber % MOTIVATION.length];
}
