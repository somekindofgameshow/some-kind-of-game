"use client";

import { useEffect, useMemo, useState } from "react";
import GameCard from "./GameCard";
import FooterPortal from "./FooterPortal";
import FloatingFooter from "./FloatingFooter";
import ClientScoreBoard from "./ClientScoreBoard";

// If you prefer to avoid hardcoding the domain, set NEXT_PUBLIC_WP_BASE_URL
// in Vercel and use it below. Falls back to your domain:
const WP_BASE =
  process.env.NEXT_PUBLIC_WP_BASE_URL || "https://somekindofgame.com";

// Types kept inline to avoid any conflicts with shared types elsewhere.
type GameItem = {
  id: string;
  databaseId: number;
  title: string;
  slug: string;
  content?: string;
  excerpt?: string;
  uri?: string; // e.g. /family-game-night/sweet-nothings/
};

type Props = {
  games: GameItem[];
  players: string[];
  initialSessionId?: string;
};

export default function SessionClient({ games, players, initialSessionId }: Props) {
  // Recover sessionId if not in URL (works with refreshes)
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
      if (!Number.isNaN(n)) {
        setIndex(Math.min(Math.max(n, 0), Math.max(games.length - 1, 0)));
      }
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

  // Build blog URL for the current game
  const blogUrl =
    current?.uri
      ? `${WP_BASE}${current.uri}`
      : `${WP_BASE}/`; // fallback to home if no uri

  return (
    <div className="w-full flex flex-col items-center gap-6">
      
      
      {/* Progress header */}
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm opacity-80">
            Game {Math.min(index + 1, games.length)} of {games.length}
          </p>
          <p className="text-sm opacity-80">{progressPct}%</p>
        </div>
        <div className="h-2 rounded bg-white/10 overflow-hidden">
          <div className="h-full bg-white/70" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Current game card */}
      <div className="w-full max-w-xl">
        {current ? (
          <GameCard
            title={current.title}
            slug={current.slug}
            content={current.content}
            excerpt={current.excerpt}
            //uri={current.uri}
          />
        ) : (
          <p className="opacity-75">No games loaded.</p>
        )}
      </div>


      {/* Floating scoreboard footer */}
<FooterPortal>
  <FloatingFooter sessionKey={effectiveSessionId || "default"}>
    <ClientScoreBoard
      players={players}
      sessionId={effectiveSessionId || "default"}
    />
  </FloatingFooter>
</FooterPortal>


      {/* Controls */}
      <div className="mt-2 flex gap-3">
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
        <p className="mt-1 text-sm opacity-80">
          🎉 You reached the end. You can press <b>Restart Session</b> or use the scoreboard’s{" "}
          <b>End Game</b> to announce the winner.
        </p>
      )}

      {/* Feedback link (replaces in-app comments) */}
      {current && (
        <div className="w-full max-w-3xl mt-2 rounded-2xl skg-surface skg-border p-4">
          <h3 className="font-semibold mb-2">Feedback</h3>
          <p className="opacity-90">
            If you have any feedback on this game, please visit this blog post to leave a
            comment:
          </p>
          <a
            href={blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 skg-btn px-4 py-2 rounded-lg"
          >
            Go to blog post ↗
          </a>
        </div>
      )}
    </div>
  );
}
