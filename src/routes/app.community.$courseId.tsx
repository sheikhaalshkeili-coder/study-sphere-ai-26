import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Layers, Flag, Copy, Trash2, Play, X, Loader2, Share2 } from "lucide-react";
import {
  useCommunityProfile, useEnrollments, useCommunityMembers, useSharedDecks, useShareDeck,
  useDeleteSharedDeck, useReportDeck, type SharedDeck,
} from "@/hooks/use-community";
import { useFlashcards, useBulkCreateFlashcards } from "@/hooks/use-study-data";
import { courseById } from "@/lib/gems-courses";

export const Route = createFileRoute("/app/community/$courseId")({
  head: () => ({
    meta: [
      { title: "Class community — StudySphere AI" },
      { name: "description", content: "Classmates and shared flashcard decks for your GEMS course." },
      { property: "og:title", content: "Class community — StudySphere AI" },
      { property: "og:description", content: "Classmates and shared flashcard decks for your GEMS course." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { courseId } = Route.useParams();
  const course = courseById(courseId);
  const { data: profile, isLoading: pl } = useCommunityProfile();
  const { data: enrolled = [], isLoading: el } = useEnrollments();

  if (pl || el) return <div className="grid place-items-center pt-24"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  if (profile?.gems_status !== "member" || !enrolled.includes(courseId) || !course) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="font-semibold">You're not in this class community.</p>
        <p className="mt-1 text-sm text-muted-foreground">Add this course to your list to see classmates and shared decks.</p>
        <Link to="/app/community" className="mt-4 inline-block rounded-3xl bg-gradient-brand px-5 py-3 text-sm font-semibold text-primary-foreground">Go to my courses</Link>
      </div>
    );
  }
  return <Course courseId={courseId} name={course.name} myId={profile.id} />;
}

function Course({ courseId, name, myId }: { courseId: string; name: string; myId: string }) {
  const { data: members = [] } = useCommunityMembers(courseId);
  const { data: decks = [], isLoading } = useSharedDecks(courseId);
  const [sharing, setSharing] = useState(false);
  const [studying, setStudying] = useState<SharedDeck | null>(null);
  const others = members.filter((m) => !m.is_me);

  return (
    <div className="px-5 pt-6">
      <Link to="/app/community" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" /> Courses</Link>
      <h1 className="mt-3 font-display text-2xl font-bold">{name}</h1>

      <h2 className="mt-6 font-display text-lg font-bold">Classmates</h2>
      {others.length === 0 ? (
        <p className="mt-2 rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          No visible classmates yet. Others appear here once they add {name} and turn on visibility.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {others.map((m) => (
            <div key={m.user_id} className="flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-3 shadow-soft">
              {m.avatar_url ? <img src={m.avatar_url} alt="" className="size-7 rounded-full object-cover" /> :
                <span className="grid size-7 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground">{m.name.charAt(0)}</span>}
              <span className="text-sm font-medium">{m.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Shared Flashcards</h2>
        <button onClick={() => setSharing((s) => !s)} className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
          <Share2 className="size-4" />{sharing ? "Close" : "Share a deck"}
        </button>
      </div>
      {sharing && <ShareForm courseId={courseId} courseName={name} onDone={() => setSharing(false)} />}

      {isLoading ? null : decks.length === 0 ? (
        <p className="mt-3 rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
          No shared decks yet. Be the first to share one with {name}.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {decks.map((d) => <DeckCard key={d.id} deck={d} mine={d.owner_id === myId} onStudy={() => setStudying(d)} />)}
        </div>
      )}
      {studying && <StudyModal deck={studying} onClose={() => setStudying(null)} />}
    </div>
  );
}

function DeckCard({ deck, mine, onStudy }: { deck: SharedDeck; mine: boolean; onStudy: () => void }) {
  const copy = useBulkCreateFlashcards();
  const del = useDeleteSharedDeck();
  const report = useReportDeck();
  return (
    <div className="rounded-3xl bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent"><Layers className="size-5 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{deck.title}</p>
          <p className="text-xs text-muted-foreground">
            {deck.creator_name}{mine && " (you)"} · {deck.card_count} cards{deck.topic ? ` · ${deck.topic}` : ""} · {new Date(deck.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onStudy} className="inline-flex items-center gap-1 rounded-full bg-gradient-brand px-3.5 py-2 text-xs font-semibold text-primary-foreground"><Play className="size-3.5" /> Study</button>
        {!mine && (
          <button disabled={copy.isPending} onClick={() => copy.mutate({ cards: deck.cards, class_id: null })}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-xs font-semibold"><Copy className="size-3.5" /> Save to my cards</button>
        )}
        {mine ? (
          <button onClick={() => { if (confirm("Stop sharing this deck with the class?")) del.mutate(deck); }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-destructive"><Trash2 className="size-3.5" /> Unshare</button>
        ) : (
          <button onClick={() => { const r = prompt("What's wrong with this deck?"); if (r?.trim()) report.mutate({ deck_id: deck.id, reason: r.trim().slice(0, 500) }); }}
            className="inline-flex items-center gap-1 rounded-full border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground"><Flag className="size-3.5" /> Report</button>
        )}
      </div>
    </div>
  );
}

function ShareForm({ courseId, courseName, onDone }: { courseId: string; courseName: string; onDone: () => void }) {
  const { data: cards = [] } = useFlashcards();
  const share = useShareDeck();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const chosen = useMemo(() => cards.filter((c) => picked.has(c.id)), [cards, picked]);
  const valid = title.trim().length > 0 && chosen.length > 0;

  if (!cards.length) {
    return (
      <div className="mt-3 rounded-3xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
        You don't have any flashcards yet. <Link to="/app/study" className="font-semibold text-primary">Make some first</Link>.
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2.5 rounded-3xl bg-card p-4 shadow-soft">
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Deck title" className="input" />
      <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={80} placeholder="Topic (optional)" className="input" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pick cards ({chosen.length})</p>
      <div className="max-h-60 space-y-1.5 overflow-y-auto">
        {cards.map((c) => (
          <label key={c.id} className={`flex cursor-pointer items-start gap-2 rounded-2xl border px-3 py-2 text-sm ${picked.has(c.id) ? "border-primary bg-accent" : "border-border"}`}>
            <input type="checkbox" className="mt-1" checked={picked.has(c.id)}
              onChange={() => setPicked((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; })} />
            <span className="line-clamp-2">{c.question}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Only students in {courseName} will see this. Your private cards stay private.</p>
      <button disabled={!valid || share.isPending}
        onClick={() => share.mutate({ course_id: courseId, title: title.trim(), topic: topic.trim() || null, cards: chosen.map(({ question, answer }) => ({ question, answer })) }, { onSuccess: onDone })}
        className="w-full rounded-3xl bg-gradient-brand py-3.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50">
        Share with {courseName}
      </button>
    </div>
  );
}

function StudyModal({ deck, onClose }: { deck: SharedDeck; onClose: () => void }) {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const card = deck.cards[i];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-5 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{deck.title} · {i + 1}/{deck.cards.length}</p>
          <button onClick={onClose} aria-label="Close"><X className="size-5" /></button>
        </div>
        {card ? (
          <button onClick={() => setFlip((f) => !f)} className="mt-4 grid min-h-48 w-full place-items-center rounded-3xl bg-accent p-5 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{flip ? "Answer" : "Question"}</span>
            <span className="mt-2 text-base font-semibold">{flip ? card.answer : card.question}</span>
          </button>
        ) : <p className="mt-4 text-sm text-muted-foreground">This deck is empty.</p>}
        <div className="mt-4 flex gap-2">
          <button disabled={i === 0} onClick={() => { setI(i - 1); setFlip(false); }} className="flex-1 rounded-3xl border border-border py-3 text-sm font-semibold disabled:opacity-40">Back</button>
          <button disabled={i >= deck.cards.length - 1} onClick={() => { setI(i + 1); setFlip(false); }} className="flex-1 rounded-3xl bg-gradient-brand py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
