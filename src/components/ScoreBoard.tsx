"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ScoreBoard
 * - Persists scores per sessionId (from localStorage).
 * - Players arranged in a responsive grid so rows wrap on long lists.
 * - `variant="compact"` for header use (smaller paddings/buttons).
 */

type Props = {
  players: string[];
  sessionKey?: string; // optional explicit key; if omitted, uses "skg-score-default"
  variant?: "default" | "compact";
};

type Scores = Record<string, number>;

const STORAGE_PREFIX = "skg-scores-";

export default function ScoreBoard({
  players,
  sessionKey = "default",
  variant = "default",
}: Props) {
  const storageKey = useMemo(() => STORAGE_PREFIX + sessionKey, [sessionKey]);

  const [scores, setScores] = useState<Scores>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setScores(raw ? JSON.parse(raw) : {});
    } catch {
      setScores({});
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scores));
    } catch {}
  }, [scores, storageKey]);

  const inc = (name: string) =>
    setScores((s) => ({ ...s, [name]: (s[name] || 0) + 1 }));
  const dec = (name: string) =>
    setScores((s) => ({ ...s, [name]: Math.max(0, (s[name] || 0) - 1) }));
  const reset = () => setScores({});
  const totalFor = (name: string) => scores[name] || 0;

  // leader (simple max)
  const leader = players.reduce(
    (best, p) => {
      const v = scores[p] || 0;
      if (v > best.score) return { name: p, score: v };
      return best;
    },
    { name: "", score: -1 }
  );

  const isCompact = variant === "compact";

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
          // auto-fit min cards to keep name + buttons on one line where possible
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
          <button className="skg-btn px-3 py-1 rounded-lg">End Game</button>
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
