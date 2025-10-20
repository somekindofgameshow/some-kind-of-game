"use client";

import { useEffect, useMemo, useState } from "react";

type ScoreBoardProps = {
  players: string[];
  sessionId: string; // used for localStorage key
};

export default function ScoreBoard({ players, sessionId }: ScoreBoardProps) {
  const STORAGE_KEY = useMemo(() => `skg-scores-${sessionId}`, [sessionId]);

  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p, 0]))
  );
  const [finished, setFinished] = useState(false);

  // Load existing scores for this session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>;
        // Merge in case player list changed
        const merged: Record<string, number> = {};
        players.forEach((p) => (merged[p] = saved[p] ?? 0));
        setScores(merged);
      } else {
        // initialize for new session
        const init = Object.fromEntries(players.map((p) => [p, 0]));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
        setScores(init);
      }
    } catch {}
    // re-run when player list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [STORAGE_KEY, players.join(",")]);

  // Save whenever scores change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
    } catch {}
  }, [scores, STORAGE_KEY]);

  const updateScore = (player: string, delta: number) => {
    setScores((prev) => ({ ...prev, [player]: (prev[player] ?? 0) + delta }));
  };

  const winner = Object.entries(scores).reduce<[string, number]>(
    (top, curr) => (curr[1] > top[1] ? [curr[0], curr[1]] : top),
    ["", -Infinity]
  );

  if (finished) {
    return (
      <div className="skg-surface rounded-2xl p-6 text-center shadow-lg border skg-border">
        <h2 className="text-3xl font-bold mb-3">🏆 Winner!</h2>
        <p className="text-2xl mb-4">{winner[0] || "No one yet 😅"}</p>
        <button
          className="skg-btn px-4 py-2 rounded-xl font-semibold transition"
          onClick={() => setFinished(false)}
        >
          Back to scores
        </button>
      </div>
    );
  }

  return (
    <div className="skg-surface rounded-xl p-4 shadow-md max-w-md w-full text-center border skg-border">
      <h3 className="text-lg font-bold mb-2">Scoreboard</h3>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p} className="flex justify-between items-center">
            <span>{p}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateScore(p, -1)}
                className="px-2 rounded"
                style={{ background: "#e11d48", color: "#fff" }}
              >
                −
              </button>
              <span>{scores[p] ?? 0}</span>
              <button
                onClick={() => updateScore(p, +1)}
                className="px-2 rounded skg-btn"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 opacity-75">
        🏆 Current leader: <b>{winner[0] || "None yet"}</b>
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <button
          onClick={() => setFinished(true)}
          className="skg-btn font-semibold py-2 px-4 rounded-xl transition"
        >
          End Game
        </button>
        <button
          onClick={() => {
            const reset = Object.fromEntries(players.map((p) => [p, 0]));
            setScores(reset);
          }}
          className="px-4 py-2 rounded-xl font-semibold"
          style={{ background: "#374151", color: "#fff" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
