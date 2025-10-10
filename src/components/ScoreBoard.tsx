"use client";

import { useState } from "react";

type ScoreBoardProps = {
  players: string[];
};

export default function ScoreBoard({ players }: ScoreBoardProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(players.map((p) => [p, 0]))
  );
  const [finished, setFinished] = useState(false);

  const updateScore = (player: string, delta: number) => {
    setScores((prev) => ({ ...prev, [player]: prev[player] + delta }));
  };

  const winner = Object.entries(scores).reduce(
    (top, curr) => (curr[1] > top[1] ? curr : top),
    ["", 0]
  );

  if (finished) {
    return (
      <div className="bg-gradient-to-b from-green-600 to-green-800 text-white rounded-2xl p-6 text-center shadow-lg">
        <h2 className="text-3xl font-bold mb-3">🏆 Winner!</h2>
        <p className="text-2xl mb-4">{winner[0] || "No one yet 😅"}</p>
        <button
          className="bg-white text-green-800 px-4 py-2 rounded-xl font-semibold hover:bg-gray-200 transition"
          onClick={() => setFinished(false)}
        >
          Back to scores
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/90 rounded-xl p-4 shadow-md max-w-md w-full text-center">
      <h3 className="text-lg font-bold mb-2">Scoreboard</h3>
      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p} className="flex justify-between items-center text-white">
            <span>{p}</span>
            <div className="flex gap-2">
              <button
                onClick={() => updateScore(p, -1)}
                className="bg-red-600 px-2 rounded hover:bg-red-700"
              >
                −
              </button>
              <span>{scores[p]}</span>
              <button
                onClick={() => updateScore(p, +1)}
                className="bg-green-600 px-2 rounded hover:bg-green-700"
              >
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-gray-400">
        🏆 Current leader: <b>{winner[0] || "None yet"}</b>
      </p>

      <button
        onClick={() => setFinished(true)}
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition"
      >
        End Game
      </button>
    </div>
  );
}
