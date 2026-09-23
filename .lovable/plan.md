# StudySphere AI — real-data completion pass

Everything below is built on the student's own saved data. No sample content anywhere.

## 1. Tutor Me (major new section)

A dedicated tutoring space inside the AI tab, separate from quick questions.

- Conversation list: start a new conversation, switch between past ones, rename-free (auto-titled from the first question), delete a conversation, clear the current one.
- Chat interface: student bubbles, tutor bubbles, typing indicator, streaming answers, retry on failure, follow-up questions in the same thread.
- Subject picker at the top: pick one of the student's real classes so the tutor knows what is being studied. "No classes yet — add one" when empty.
- 20 suggested prompts (explain step by step, quiz me, practice question, where did I go wrong, 30-minute study plan, turn my notes into flashcards, harder/easier question, real-world example, memorise this, etc.), shown as tappable chips on an empty thread and behind a "Prompts" button once a conversation starts.
- Tutor replies stay conversational and never dump the answer when the student asks for guidance instead.

## 2. Personalised AI

Before each tutor reply, the app gathers the student's own context for the chosen class: class details, note titles and text, flashcards, upcoming assignments and exams, recent grades. The tutor uses only that. When the student asks about notes they haven't written, it says so and invites them to add some — it never invents content.

## 3. AI study tools

Kept in the Study tab and upgraded: flashcard generator, quiz generator, note summariser, study plan generator, essay brainstorming, practice questions. Each works from a chosen class's real notes/flashcards or from text the student types. Generated flashcards and quizzes get a "Save to my account" button so they land in the student's own decks.

## 4. Dashboard

Real name, today's date, a rotating motivational line, today's classes, upcoming assignments, upcoming exams with live countdowns, study streak (consecutive days with a completed task or study session), weekly study-goal progress, and recent activity. Empty states everywhere instead of filler.

## 5. Assignments, exams, planner

- Assignments: create, edit, delete, complete/uncomplete, with title, class, notes, due date, priority. Buckets: Today, Tomorrow, This Week, Overdue, Completed.
- Exams: name, class, date, time, notes, priority, real countdown.
- Study planner: student enters available study time, preferred times of day and goals; a schedule is generated only from their real classes and exams, and each generated session can be edited or deleted.

## 6. Notes, flashcards, timer

- Notes: create, edit, delete, group by class, search.
- Flashcards: create, edit, delete, group by class/topic, study mode with progress tracking.
- Study timer: finishing a session saves duration, date and optional class, and feeds statistics and the streak.

## 7. Analytics and achievements

A new Progress area: study time, completed assignments, grade trend, streak, subject activity, exam prep. Each panel only appears with enough real data, otherwise "Not enough data yet. Start studying to see your progress." Achievements unlock strictly from real counts (first assignment, first study session, first deck, 7-day streak, 10 assignments).

## 8. Google Classroom

Google Calendar stays removed. The Planner gets a "Connect Google Classroom" button with an honest status: until Google credentials are supplied it clearly shows "Not connected" and explains what is needed. Nothing is ever displayed as imported unless it truly came from the student's own connected Google account.

To finish the real connection later I'll need, from your Google Cloud project: Classroom API enabled, an OAuth client ID and secret, with the app's callback address registered. I'll walk you through it when you're ready.

## 9. Authentication and data isolation

Sign up, log in, log out, plus new forgot-password and reset-password screens. All app routes stay protected, the signed-in student's own profile loads every time, and every table stays locked to its owner so one account can never see another's classes, work, grades, notes, cards, sessions or stats.

## 10. Design and cleanup

Existing blue/white/purple look, rounded cards, soft shadows, bottom navigation and dark mode all preserved. Final sweep removes any leftover fake names or filler text and every screen gets a polished empty state with a clear action button.

## Technical notes

- New tables: `tutor_conversations` (+ `conversation_id` on `chat_messages`), `study_plan_sessions`, `flashcard_progress`, `achievements`; RLS owner-only policies and grants on each.
- Tutor endpoint: `src/routes/api/tutor.ts` streaming through the Lovable AI gateway, receiving a server-assembled context bundle scoped to the signed-in student.
- New routes: `app.tutor.tsx`, `app.progress.tsx`, `forgot-password.tsx`, `reset-password.tsx`.
- Extended hooks in `use-study-data.ts` for conversations, sessions, progress and achievements; streak and analytics computed in a new `src/lib/stats.ts`.
