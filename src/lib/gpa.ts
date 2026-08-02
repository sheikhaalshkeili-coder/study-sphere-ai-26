export const GRADE_CATEGORIES = ["quiz", "test", "homework", "project", "exam", "other"] as const;
export type GradeCategory = (typeof GRADE_CATEGORIES)[number];

export type GradeLike = {
  class_id: string | null;
  score: number;
  max_score: number;
  weight: number;
};

/** Weighted percentage (0-100) for a set of grades, or null when there are none. */
export function weightedPercent(grades: GradeLike[]): number | null {
  const usable = grades.filter((g) => g.max_score > 0 && g.weight > 0);
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((s, g) => s + g.weight, 0);
  const earned = usable.reduce((s, g) => s + (g.score / g.max_score) * g.weight, 0);
  return (earned / totalWeight) * 100;
}

/** Standard US 4.0-scale conversion. */
export function percentToPoints(percent: number): number {
  if (percent >= 93) return 4.0;
  if (percent >= 90) return 3.7;
  if (percent >= 87) return 3.3;
  if (percent >= 83) return 3.0;
  if (percent >= 80) return 2.7;
  if (percent >= 77) return 2.3;
  if (percent >= 73) return 2.0;
  if (percent >= 70) return 1.7;
  if (percent >= 67) return 1.3;
  if (percent >= 63) return 1.0;
  if (percent >= 60) return 0.7;
  return 0;
}

export function letterFor(percent: number): string {
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";
  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";
  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";
  if (percent >= 67) return "D+";
  if (percent >= 63) return "D";
  if (percent >= 60) return "D-";
  return "F";
}

/**
 * GPA across classes: each class is averaged from its own grades, then the
 * class points are averaged. Returns null when the student has no grades.
 */
export function computeGpa(grades: GradeLike[]): { gpa: number; classCount: number } | null {
  if (grades.length === 0) return null;
  const byClass = new Map<string, GradeLike[]>();
  for (const g of grades) {
    const key = g.class_id ?? "__unassigned";
    const list = byClass.get(key);
    if (list) list.push(g);
    else byClass.set(key, [g]);
  }
  const points: number[] = [];
  byClass.forEach((list) => {
    const pct = weightedPercent(list);
    if (pct !== null) points.push(percentToPoints(pct));
  });
  if (points.length === 0) return null;
  return {
    gpa: points.reduce((a, b) => a + b, 0) / points.length,
    classCount: points.length,
  };
}
