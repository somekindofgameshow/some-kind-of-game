"use client";

import { useEffect, useMemo, useState } from "react";
import GameCard from "./GameCard";
import ClientScoreBoard from "./ClientScoreBoard";

type Game = { id: string; title: string; slug: string; content?: string };

type Props = {
  games: Game[];
  players: string[];
  initialSessionId?: string;
};

export default function SessionClient({ games, players, initialSessionId }: Props) {
  // Recover sessionId via ClientScoreBoard logic too
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);

  useEffect(() => {
    if (!initialSessionId) {
      try {
        const saved = localStorage.getItem("skg-current-session-id");
        if (saved) setSessionId(saved);
      } catch {}
    }
  }, [initialSessionId]);

  const effectiveSessionId = sessionId || "temp";

  // Persist current index per session
  const PROGRESS_KEY = useMemo(
    () => `skg-progress-${effectiveSessionId}`,
    [effectiveSessionId]
  );

  const [index, setIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const n = raw ? Number(raw) : 0;
      if (!Number.isNaN(n)) setIndex(Math.min(Math.max(n, 0), Math.max(games.length - 1, 0)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [PROGRESS_KEY, games.length]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, String(index));
    } catch {}
  }, [index, PROGRESS_KEY]);

  const atLast = index >= games.length - 1;
  const progressPct = games.length ? Math.round(((index + 1) / games.length) * 100) : 0;

  const next = () => setIndex((i) => Math.min(i + 1, games.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));
  const resetProgress = () => setIndex(0);

  const current = games[index];

  return (
    <div className="w-full max-w-6xl grid gap-6 md:grid-cols-[360px,1fr]">
      {/* LEFT: sticky scoreboard */}
      <aside className="md:sticky md:top-24 h-max">
        <ClientScoreBoard players={players} initialSessionId={effectiveSessionId} />
      </aside>

      {/* RIGHT: game viewer + progress */}
      <section className="flex flex-col items-center">
        {/* Progress header */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm opacity-80">
              Game {Math.min(index + 1, games.length)} of {games.length}
            </p>
            <p className="text-sm opacity-80">{progressPct}%</p>
          </div>
          <div className="h-2 rounded bg-white/10 overflow-hidden">
            <div
              className="h-full bg-white/70"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current game card */}
        {current ? (
          <div className="w-full max-w-xl">
            <GameCard title={current.title} slug={current.slug} content={current.content} />
          </div>
        ) : (
          <p className="opacity-75">No games loaded.</p>
        )}

        {/* Controls */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={prev}
            disabled={index === 0}
            className="px-4 py-2 rounded-xl font-semibold disabled:opacity-40"
            style={{ background: "#374151", color: "#fff" }}
          >
            Previous
          </button>
          {!atLast ? (
            <button onClick={next} className="skg-btn px-4 py-2 rounded-xl font-semibold">
              Next Game
            </button>
          ) : (
            <button onClick={resetProgress} className="skg-btn px-4 py-2 rounded-xl font-semibold">
              Restart Session
            </button>
          )}
        </div>

        {atLast && (
          <p className="mt-3 text-sm opacity-80">
            🎉 You reached the end. You can press <b>Restart Session</b> or use the
            scoreboard’s <b>End Game</b> to announce the winner.
          </p>
        )}
      </section>
    </div>
  );
}
