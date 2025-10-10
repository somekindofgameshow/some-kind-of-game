"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SetupPage() {
  const router = useRouter();
  const [numGames, setNumGames] = useState(3);
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");

  const addPlayer = () => {
    if (newPlayer.trim() && !players.includes(newPlayer)) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer("");
    }
  };

  const startGame = () => {
    const params = new URLSearchParams({
      count: numGames.toString(),
      players: players.join(","),
    });
    router.push(`/play/session?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Setup Game</h1>

      <label className="mb-2">Number of games:</label>
      <input
        type="number"
        value={numGames}
        min={1}
        max={10}
        onChange={(e) => setNumGames(Number(e.target.value))}
        className="text-black px-2 py-1 rounded mb-4"
      />

      <div className="mb-4 w-full max-w-xs">
        <label>Add players:</label>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="Enter name"
            className="flex-1 text-black px-2 py-1 rounded"
          />
          <button
            onClick={addPlayer}
            className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 list-disc list-inside text-gray-300">
          {players.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <button
        onClick={startGame}
        className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-500"
        disabled={players.length === 0}
      >
        Start Game
      </button>
    </main>
  );
}
