"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * ScoreBoard
 * - Persists scores per sessionKey (localStorage).
 * - Responsive grid that wraps player rows.
 * - variant="compact" shrinks paddings for header use, "default" is the body card.
 * - Sound effects:
 *    - + : higher-pitch click
 *    - − : lower-pitch click
 *    - End Game : victory fanfare if a single winner, neutral tone if tie
 */

type Props = {
  players: string[];
  sessionKey?: string;            // optional explicit key; defaults to "default"
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

  // -----------------------
  // Persistence
  // -----------------------
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

  const inc = (name: string) => {
    playClickUp();
    setScores((s) => ({ ...s, [name]: (s[name] || 0) + 1 }));
  };

  const dec = (name: string) => {
    playClickDown();
    setScores((s) => ({ ...s, [name]: Math.max(0, (s[name] || 0) - 1) }));
  };

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

  // -----------------------
  // Tiny WebAudio synth
  // -----------------------
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch {
        audioCtxRef.current = null;
      }
    }
    return audioCtxRef.current;
  };

  // basic one-shot beep
  const beep = (freq: number, ms: number, type: OscillatorType = "sine", gain = 0.04) => {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;

    osc.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    // quick envelope to avoid clicks
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);

    osc.start(now);
    osc.stop(now + ms / 1000 + 0.02);
  };

  // Click sounds (A)
  const playClickUp = () => {
    // short, slightly higher pitch “positive”
    beep(880, 70, "sine", 0.05);
  };
  const playClickDown = () => {
    // short, slightly lower pitch “negative”
    beep(440, 70, "sine", 0.05);
  };

  // Victory / tie (C) on End Game
  const playVictory = () => {
    // tiny triumphant arpeggio
    const ctx = getCtx();
    if (!ctx) return;
    const base = 523.25; // C5
    const steps = [0, 4, 7, 12]; // major arpeggio degrees
    steps.forEach((st, idx) => {
      setTimeout(() => beep(base * Math.pow(2, st / 12), 140, "triangle", 0.06), idx * 120);
    });
    // small “button confirm” at the end
    setTimeout(() => beep(1046.5, 160, "triangle", 0.05), steps.length * 120 + 60);
  };

  const playTie = () => {
    // neutral “boop”
    beep(600, 150, "square", 0.04);
  };

  const onEndGame = () => {
    // decide winner or tie
    const max = Math.max(0, ...players.map((p) => scores[p] || 0));
    const winners = players.filter((p) => (scores[p] || 0) === max);
    if (winners.length === 1 && max > 0) {
      playVictory();
    } else {
      playTie();
    }
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
          <button
            onClick={onEndGame}
            className="skg-btn px-3 py-1 rounded-lg"
          >
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
