"use client";

import { useMemo, useState } from "react";

type GameLite = { databaseId: number; title: string };

type Props = {
  games: GameLite[];
  currentDatabaseId?: number;
};

export default function CommentBox({ games, currentDatabaseId }: Props) {
  const [postId, setPostId] = useState<number | undefined>(currentDatabaseId ?? games[0]?.databaseId);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...games].sort((a, b) => a.title.localeCompare(b.title)),
    [games]
  );

  const submit = async () => {
    setMsg(null);
    if (!postId) return setMsg("Select a game.");
    if (!content.trim()) return setMsg("Please write a comment.");

    setBusy(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: authorName.trim() || undefined,
          authorEmail: authorEmail.trim() || undefined,
          content: content.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to submit");

      setMsg("Thanks! Your feedback was submitted and may appear after moderation.");
      setContent("");
    } catch (e: any) {
      setMsg(e?.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="w-full max-w-3xl mt-8 p-4 rounded-2xl skg-surface skg-border">
      <h3 className="text-lg font-semibold mb-3">Feedback</h3>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm opacity-80">Game</span>
          <select
            value={postId}
            onChange={(e) => setPostId(Number(e.target.value))}
            className="rounded px-3 py-2 bg-black/40 border border-white/15"
          >
            {sorted.map((g) => (
              <option key={g.databaseId} value={g.databaseId}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Name (optional)</span>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="rounded px-3 py-2 bg-black/40 border border-white/15"
              placeholder="Your name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm opacity-80">Email (optional)</span>
            <input
              type="email"
              value={authorEmail}
              onChange={(e) => setAuthorEmail(e.target.value)}
              className="rounded px-3 py-2 bg-black/40 border border-white/15"
              placeholder="your@email.com"
            />
          </label>
        </div>
      </div>

      <label className="flex flex-col gap-1 mt-3">
        <span className="text-sm opacity-80">Your feedback</span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="rounded px-3 py-2 bg-black/40 border border-white/15"
          placeholder="What worked? What didn’t?"
        />
      </label>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={submit}
          disabled={busy}
          className="skg-btn px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {busy ? "Sending..." : "Submit"}
        </button>
        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </div>
    </section>
  );
}
