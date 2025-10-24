"use client";

import { useEffect, useState } from "react";

type GameOption = { databaseId: number; title: string };

type Props = {
  games: GameOption[];
  /** Prefill/select the currently shown game */
  activeGameId?: number;
};

export default function CommentBox({ games, activeGameId }: Props) {
  const [postId, setPostId] = useState<number | null>(
    activeGameId ?? games[0]?.databaseId ?? null
  );

  // Keep the select in sync when the current card changes
  useEffect(() => {
    if (activeGameId) setPostId(activeGameId);
  }, [activeGameId]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");

  const [status, setStatus] = useState<
    "idle" | "sending" | "ok" | "err" | "misconf"
  >("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!postId || !content.trim()) return;

    setStatus("sending");
    setMessage("");

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          authorName: name || undefined,
          authorEmail: email || undefined,
          content,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("misconf");
        setMessage(json?.error || "Server is not configured for WordPress comments.");
        return;
      }

      setStatus("ok");
      setMessage("Thanks! Your feedback was submitted.");
      setContent("");
    } catch (err: any) {
      setStatus("err");
      setMessage(err?.message || "Something went wrong.");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-3xl rounded-2xl skg-surface skg-border p-4 md:p-6 mt-4 space-y-3"
    >
      <h3 className="text-lg font-semibold">Feedback</h3>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="md:col-span-1 text-sm opacity-80">
          Game
          <select
            className="w-full mt-1 text-white rounded-md px-2 py-1"
            value={postId ?? undefined}
            onChange={(e) => setPostId(Number(e.target.value))}
          >
            {games.map((g) => (
              <option key={g.databaseId} value={g.databaseId}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm opacity-80">
          Name (optional)
          <input
            className="w-full mt-1 text-white rounded-md px-2 py-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="your name"
          />
        </label>

        <label className="text-sm opacity-80">
          Email (optional)
          <input
            type="email"
            className="w-full mt-1 text-white rounded-md px-2 py-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </label>
      </div>

      <label className="block text-sm opacity-80">
        Your feedback
        <textarea
          rows={4}
          className="w-full mt-1 text-white rounded-md px-3 py-2"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Feedback and ideas"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          className="skg-btn px-4 py-2 rounded-lg disabled:opacity-50"
          disabled={!postId || !content.trim() || status === "sending"}
        >
          Submit
        </button>
        {message && (
          <p
            className={`text-sm ${
              status === "ok"
                ? "text-green-400"
                : status === "misconf" || status === "err"
                ? "text-red-400"
                : "opacity-80"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
