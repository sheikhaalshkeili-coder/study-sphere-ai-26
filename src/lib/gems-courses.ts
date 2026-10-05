// GEMS American Academy Abu Dhabi course catalogue, grouped by department.
// Grade eligibility is inferred from course naming conventions (see gradesFor).

export type GemsCourse = { id: string; name: string; category: string; grades: number[] };

const RAW: Record<string, string[]> = {
  English: [
    "English 6", "English 7", "English 8", "English 9", "English 10", "English 11", "English 12",
    "English Language Learning 6", "English Language Learning 7", "English Language Learning 8",
    "English Language Learning 9", "English Language Learning 10", "English Language Learning 11",
    "English Language Learning 12", "English 7 Honors", "English 8 Honors", "English 9 Honors",
    "English 10 Honors", "AP English Language and Composition", "AP English Literature and Composition",
    "IBDP I and II English Language B (SL/HL)", "IBDP I and II English Language and Literature (SL)",
    "IBDP I and II Language and Culture (SL)", "Creative Writing", "Public Speaking", "Journalism",
  ],
  Arabic: [
    "Arabic Native 6", "Arabic Native 7", "Arabic Native 8", "Arabic Native 9", "Arabic Native 10",
    "Arabic Native 11", "Arabic Native 12", "MS Arabic Non-Native Level A", "MS Arabic Non-Native Level B",
    "Arabic Standard Non-Native 6", "Arabic Standard Non-Native 7", "Arabic Standard Non-Native 8",
    "HS Arabic Non-Native Level A", "HS Arabic Non-Native Level B", "Arabic Standard Non-Native 9",
    "Arabic Standard Non-Native 10", "IBDP I and II Arabic B (SL/HL)", "Arabic Standard Non-Native 11",
    "Arabic Standard Non-Native 12",
  ],
  French: [
    "MS French 1", "MS French 1-2", "MS French 2", "HS French I", "HS French II", "HS French III",
    "IBDP I and II French Ab Initio (SL)", "IBDP I and II French B (SL/HL)",
  ],
  Spanish: [
    "MS Spanish 1", "MS Spanish 1-2", "MS Spanish 2", "HS Spanish I", "HS Spanish II", "HS Spanish III",
    "IBDP I and II Spanish Ab Initio (SL)", "IBDP I and II Spanish (SL/HL)",
  ],
  "Social Studies & MSCE": [
    "Social Studies 6", "Social Studies 7", "Social Studies 8", "Social Studies 9", "World Studies 10",
    "Geography", "Psychology", "Global Politics", "Economics", "AP Psychology", "AP World History: Modern",
    "AP Macroeconomics", "AP Microeconomics", "IBDP I and II History (SL/HL)",
    "IBDP I and II Psychology (SL/HL)", "IBDP I and II Business & Management (SL/HL)",
    "IBDP I and II Economics (SL/HL)",
  ],
  "Islamic Studies": [
    ...[6, 7, 8, 9, 10, 11, 12].map((g) => `Islamic Studies Arabic ${g}`),
    ...[6, 7, 8, 9, 10, 11, 12].map((g) => `Islamic Studies English ${g}`),
    "Moral Education", "Social and Cultural Education",
  ],
  Science: [
    "Integrated Science 6", "Integrated Science 7", "Integrated Science 8", "Biology", "Chemistry", "Physics",
    "IBDP I and II Computer Science (SL/HL)", "IBDP I and II Physics (SL/HL)", "IBDP I and II Chemistry (SL/HL)",
    "IBDP I and II Biology (SL/HL)", "IBDP I and II Sports, Exercise and Health Sciences (SL/HL)",
    "AP Biology", "AP Chemistry", "AP Physics 1", "AP Computer Science Principles",
    "Physiology and Sports Science", "Environmental Science", "Computer Science",
  ],
  Mathematics: [
    "Integrated Math 6", "Integrated Math 7", "Integrated Math 7 Honors", "Integrated Math 8",
    "Integrated Math I", "Integrated Math I Honors", "Integrated Math II", "Integrated Math II Honors",
    "Integrated Math III", "Integrated Math III Honors", "Precalculus", "Probability and Statistics Mathematics",
    "AP Precalculus", "AP Calculus AB", "IBDP I and II Math Applications & Interpretations (SL/HL)",
    "IBDP I and II Math Analysis & Approaches (SL/HL)",
  ],
  "Visual Arts & Design": [
    "Grade 6 Elective Rotation", "MS Exploratory Arts – Visual Arts 6", "MS Design 7", "MS Design 8",
    "HS Design", "Visual Arts 1", "Visual Arts 2", "IBDP I and II Visual Arts (SL/HL)",
  ],
  "Theatre Arts": [
    "Theater Arts 7", "Theater Arts 8", "Theater I", "Theater II", "Theater III", "Theater IV",
    "Visual Arts and Technical Theater", "Film Studies",
  ],
  Music: ["Band I", "Band II", "Band III", "Digital Music I"],
  "Physical Education": [
    "Physical Education 6", "Physical Education 7", "Physical Education 8", "Physical Education 9",
    "Physical Education 10", "Weight Training and Fitness I", "Weight Training and Fitness II",
  ],
};

const MS = [6, 7, 8];
const HS = [9, 10, 11, 12];

function gradesFor(name: string): number[] {
  if (name.startsWith("IBDP")) return [11, 12];
  if (name.startsWith("AP ")) return name.includes("Calculus") || name.includes("Precalculus") ? [11, 12] : [10, 11, 12];
  const im = name.match(/^Integrated Math (I{1,3})\b/);
  if (im) return [{ I: 9, II: 10, III: 11 }[im[1] as "I" | "II" | "III"]];
  if (/^Grade 6/.test(name)) return [6];
  const num = name.match(/\b(6|7|8|9|10|11|12)\b(?!\s*-)/);
  if (num && !/^MS (French|Spanish)/.test(name)) return [Number(num[1])];
  if (name.startsWith("MS ")) return MS;
  if (name.startsWith("HS ")) return HS;
  if (name === "Precalculus" || name.startsWith("Probability")) return [11, 12];
  return HS;
}

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const GEMS_COURSES: GemsCourse[] = Object.entries(RAW).flatMap(([category, names]) =>
  names.map((name) => ({ id: slug(name), name, category, grades: gradesFor(name) })),
);

export const GEMS_CATEGORIES = Object.keys(RAW);

const BY_ID = new Map(GEMS_COURSES.map((c) => [c.id, c]));
export const courseById = (id: string) => BY_ID.get(id);

/** Extracts a numeric grade (6–12) from free text such as "Grade 11" or "11". */
export function parseGrade(text: string | null | undefined): number | null {
  const m = (text ?? "").match(/\b(6|7|8|9|10|11|12)\b/);
  return m ? Number(m[1]) : null;
}

export const GEMS_SCHOOL_NAME = "GEMS American Academy Abu Dhabi";
