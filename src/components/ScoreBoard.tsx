"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ScoreBoard
 * - Persists scores per session (namespaced key).
 * - Responsive grid so player rows wrap nicely with long lists.
 * - variant="compact" for header use.
 * - Accepts either `sessionId` (preferred) or `sessionKey` (back-compat).
 */

type Props = {
  players: string[];
  /** Preferred: per-session namespace for localStorage */
  sessionId?: string;
  /** Back-compat with your previous prop; ignored if sessionId is provided */
  sessionKey?: string;
  /** "default" (bigger) or "compact" (for header) */
  variant?: "default" | "compact";
  /** Optional callback if you want to handle End Game outside */
  onEndGame?: () => void;
};

type Scores = Record<string, number>;

const STORAGE_PREFIX = "skg-scores-";

export default function ScoreBoard({
  players,
  sessionId,
  sessionKey, // back-compat
  variant = "default",
  onEndGame,
}: Props) {
  // Decide which namespace to use: sessionId > sessionKey > "default"
  const storageKey = useMemo(() => {
    const ns = sessionId ?? sessionKey ?? "default";
    return STORAGE_PREFIX + ns;
  }, [sessionId, sessionKey]);

  const [scores, setScores] = useState<Scores>({});

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setScores(raw ? JSON.parse(raw) : {});
    } catch {
      setScores({});
    }
  }, [storageKey]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {}
  }, [scores, storageKey]);

  // Ensure players exist in map and prune removed ones
  useEffect(() => {
    setScores((prev) => {
      const next: Scores = { ...prev };
      for (const p of players) if (!(p in next)) next[p] = 0;
      for (const k of Object.keys(next)) if (!players.includes(k)) delete next[k];
      return next;
    });
  }, [players]);

  const inc = (name: string) =>
    setScores((s) => ({ ...s, [name]: (s[name] || 0) + 1 }));
  const dec = (name: string) =>
    setScores((s) => ({ ...s, [name]: Math.max(0, (s[name] || 0) - 1) }));
  const reset = () =>
    setScores(Object.fromEntries(players.map((p) => [p, 0])));

  const totalFor = (name: string) => scores[name] || 0;

  const leader =
    players.reduce(
      (best, p) => {
        const v = scores[p] || 0;
        return v > best.score ? { name: p, score: v } : best;
      },
      { name: "", score: -1 }
    ) || { name: "", score: -1 };

  const isCompact = variant === "compact";

  const handleEndGame = () => {
    if (onEndGame) onEndGame();
    // no-op by default; leave to parent if you want to show a winner screen
  };

  return (
    <div
      className={[
        "rounded-2xl skg-surface skg-border p-3 md:p-4 shadow-lg",
        isCompact ? "max-w-xl" : "max-w-2xl",
      ].join(" ")}
      aria-label="Scoreboard"
    >
      <div className="font-semibold text-center mb-2">Scoreboard</div>

      {/* Responsive grid: wraps gracefully as players increase */}
      <div
        className={[
          "grid gap-2",
          // auto-fit keeps each item wide enough for name + buttons on one line
          "grid-cols-[repeat(auto-fit,minmax(180px,1fr))]",
        ].join(" ")}
      >
        {players.map((name) => (
          <div
            key={name}
            className={[
              "flex items-center justify-between rounded-xl",
              "px-2 py-1 skg-surface/50 skg-border",
              isCompact ? "text-sm" : "text-base",
            ].join(" ")}
          >
            <span className="truncate pr-2">{name}</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => dec(name)}
                className={[
                  "rounded-lg px-2",
                  isCompact ? "py-0.5 text-sm" : "py-1",
                  "bg-rose-600 text-white",
                ].join(" ")}
                aria-label={`decrease ${name}`}
              >
                –
              </button>
              <span className="min-w-[1.25rem] text-center">
                {totalFor(name)}
              </span>
              <button
                onClick={() => inc(name)}
                className={[
                  "rounded-lg px-2",
                  isCompact ? "py-0.5 text-sm" : "py-1",
                  "bg-sky-600 text-white",
                ].join(" ")}
                aria-label={`increase ${name}`}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div
        className={[
          "flex items-center justify-between mt-3 gap-2",
          isCompact ? "text-xs" : "text-sm",
        ].join(" ")}
      >
        <div className="opacity-80">
          🏆 Current leader:{" "}
          <span className="font-semibold">
            {leader.score >= 0 ? leader.name : "—"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleEndGame} className="skg-btn px-3 py-1 rounded-lg">
            End Game
          </button>
          <button
            onClick={reset}
            className="px-3 py-1 rounded-lg bg-gray-600 text-white"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
