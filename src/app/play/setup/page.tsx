"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SavedSetup = {
  numGames: number;
  players: string[];
  categories: number[];
  tags: number[];
};

type Term = { id: number; name: string };

const STORAGE_KEY = "skg-setup";

export default function SetupPage() {
  const router = useRouter();

  const [numGames, setNumGames] = useState(3);
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");

  const [categories, setCategories] = useState<Term[]>([]);
  const [tags, setTags] = useState<Term[]>([]);
  const [chosenCatIds, setChosenCatIds] = useState<number[]>([]);
  const [chosenTagIds, setChosenTagIds] = useState<number[]>([]);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [taxLoading, setTaxLoading] = useState(true);

  // Load saved setup
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedSetup = JSON.parse(raw);
        if (saved?.numGames) setNumGames(saved.numGames);
        if (saved?.players?.length) setPlayers(saved.players);
        if (saved?.categories) setChosenCatIds(saved.categories);
        if (saved?.tags) setChosenTagIds(saved.tags);
      }
    } catch {}
  }, []);

  // Save on change
  useEffect(() => {
    const saved: SavedSetup = {
      numGames,
      players,
      categories: chosenCatIds,
      tags: chosenTagIds,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [numGames, players, chosenCatIds, chosenTagIds]);

  // Fetch categories & tags
  useEffect(() => {
    const endpoint =
      (process.env.NEXT_PUBLIC_WORDPRESS_API_URL as string) ||
      "https://somekindofgame.com/graphql";

    const query = `
      query GetTaxonomies {
        categories(first: 50) { nodes { databaseId name } }
        tags(first: 50) { nodes { databaseId name } }
      }
    `;

    setTaxLoading(true);
    setTaxError(null);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));

        const cats: Term[] =
          json?.data?.categories?.nodes?.map((n: any) => ({
            id: n.databaseId,
            name: n.name,
          })) ?? [];
        const tgs: Term[] =
          json?.data?.tags?.nodes?.map((n: any) => ({
            id: n.databaseId,
            name: n.name,
          })) ?? [];

        setCategories(cats);
        setTags(tgs);
      })
      .catch((e) => {
        console.error("Taxonomy fetch failed:", e);
        setTaxError(String(e));
      })
      .finally(() => setTaxLoading(false));
  }, []);

  const addPlayer = () => {
    const name = newPlayer.trim();
    if (name && !players.includes(name)) {
      setPlayers([...players, name]);
      setNewPlayer("");
    }
  };

  const removePlayer = (name: string) => {
    setPlayers(players.filter((p) => p !== name));
  };

  const toggle = (arr: number[], id: number, setter: (v: number[]) => void) => {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  };

  const disableStart = useMemo(
    () => players.length === 0 || numGames < 1,
    [players.length, numGames]
  );

  const startGame = () => {
    const sessionId = Date.now().toString();

    // remember current session id for iframe recovery (kept for safety)
    try {
      localStorage.setItem("skg-current-session-id", sessionId);
    } catch {}

    const params = new URLSearchParams({
      count: numGames.toString(),
      players: players.join(","),
      sessionId,
    });
    if (chosenCatIds.length) params.set("c", chosenCatIds.join(","));
    if (chosenTagIds.length) params.set("t", chosenTagIds.join(","));

    router.push(`/play/session?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Setup Game</h1>

      {/* Players */}
      <section className="w-full max-w-2xl mb-8">
        <label className="block mb-2 font-semibold">Number of games</label>
        <input
          type="number"
          value={numGames}
          min={1}
          max={20}
          onChange={(e) => setNumGames(Number(e.target.value))}
          className="text-white px-2 py-1 rounded mb-4"
        />

        <label className="block mb-2 font-semibold">Players</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="Enter name"
            className="flex-1 text-white px-2 py-1 rounded"
          />
          <button onClick={addPlayer} className="skg-btn px-3 py-1 rounded">
            Add
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {players.map((p) => (
            <li key={p} className="flex justify-between items-center">
              <span>{p}</span>
              <button
                onClick={() => removePlayer(p)}
                className="px-2 py-1 rounded"
                style={{ background: "#e11d48", color: "#fff" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Vibe + (optional) Tags */}
      <section className="w-full max-w-2xl mb-8">
        <div className={`grid ${tags.length > 0 ? "md:grid-cols-2" : "grid-cols-1"} gap-6`}>
          {/* Vibe (was Categories) */}
          <div>
            <h3 className="font-semibold mb-2">Vibe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(!taxLoading && !taxError && categories.length === 0) && (
                <p className="text-sm opacity-70">No vibes found.</p>
              )}
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={chosenCatIds.includes(c.id)}
                    onChange={() => toggle(chosenCatIds, c.id, setChosenCatIds)}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags — hidden entirely when none */}
          {tags.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Tags</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tags.map((t) => (
                  <label key={t.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={chosenTagIds.includes(t.id)}
                      onChange={() => toggle(chosenTagIds, t.id, setChosenTagIds)}
                    />
                    <span>{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* If you want to surface errors, keep this tiny line; else you can delete it */}
        {taxError && (
          <p className="text-sm opacity-75 mt-2">Could not load filters: {taxError}</p>
        )}
      </section>

      <button
        onClick={startGame}
        className="skg-btn px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
        disabled={disableStart}
      >
        Start Game
      </button>
    </main>
  );
}
