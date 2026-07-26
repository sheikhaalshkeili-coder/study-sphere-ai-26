## Goal

Make StudySphere's Planner, Dashboard, and a new My Classes page run on the user's real data, drop the fake Google Classroom card, and give every action clear toast feedback.

## 1. Database migration

- Add `type` to `assignments` (`assignment | homework | quiz | project`, default `assignment`, constrained).
- Add indexes: `assignments (user_id, due_at)`, `exams (user_id, exam_at)`, `classes (user_id, day_of_week)`.
- Regenerate types afterwards (happens automatically once the migration is approved).

Existing tables already have per-user access rules, so no policy changes are needed.

## 2. Remove Google Classroom

- Strip the connect card, toggle, sync state, fake "4 courses, 8 assignments" preview and `ClassroomIcon` from the Planner.
- Drop `classroom_connected` from the profile hook's type/select. The column stays in the database (harmless, no destructive change) unless you want it dropped too.

## 3. New "My Classes" page (`/app/classes`)

- Lists the user's classes grouped by day of week, styled with the existing rounded-card/gradient look.
- Add / edit / delete via a bottom-sheet style form: subject, teacher, room, colour swatch picker, day of week, start & end time.
- All reads/writes go to the `classes` table scoped to the signed-in user.
- Entry points: an icon button in the Planner header and a "Classes" Quick Action on the dashboard.

## 4. Planner rewrite

- Loads real classes, assignments and exams for the signed-in user.
- "+" opens a form: item kind (assignment / homework / quiz / project / exam), title, class dropdown from real classes, due date + time, priority, notes. Exams save to `exams`, everything else to `assignments` with the new `type`.
- Today / Tomorrow / This Week / Overdue filters computed from actual `due_at` / `exam_at` values, with live counts.
- Working done checkbox (writes `done`) and delete button per row; empty states kept.
- No mock arrays left.

## 5. Dashboard rewrite

- Today's classes: real `classes` rows matching today's `day_of_week`, ordered by start time.
- Upcoming assignments and exams: real rows sorted by date, with a live countdown for exams.
- Replace the invented Streak / daily-goal / Level-XP widgets with real metrics: tasks completed this week vs total due this week, and next-exam countdown.
- Quick Actions gain the Classes link.

## 6. Toasts

- Mount the existing sonner `<Toaster />` once in `src/routes/__root.tsx` (it is currently not mounted anywhere).
- Every create / update / delete on Classes and Planner fires `toast.success` or `toast.error` with a readable message.

## Technical notes

- Data fetching uses TanStack Query (`useQuery` / `useMutation` + `invalidateQueries`) with the browser Supabase client, matching the existing client-only `/app` shell; RLS scopes rows to the signed-in user.
- Shared date helpers (bucket computation, formatting) live in a small `src/lib/schedule.ts` so Planner and Dashboard agree.
- Forms are reusable components under `src/components/` rather than inline, keeping route files thin.
- Layout stays mobile-first inside the existing max-w-md shell; no colour or typography changes.
