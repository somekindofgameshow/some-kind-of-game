"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchTaxOptions,
  fetchTagsForCategory,
  type TaxItem,
} from "@/lib/api";

/** ------------------------------------------------------------------------
 * Curated vibes per playlist (by category slug)
 * Make sure slugs match your WordPress slugs exactly.
 * --------------------------------------------------------------------- */
const CURATED_VIBES: Record<string, string[]> = {
  "parents-and-kids": ["ages-6-8", "low-effort"],
  "party-games": ["chill", "playful", "wild"],
  "a-party-of-points": ["points"],
  // "date-night": ["chill", "low-effort"],
};

/** ------------------------------------------------------------------------
 * Tag match mode per playlist (by category slug)
 * --------------------------------------------------------------------- */
const TAG_MODE_BY_CATEGORY_SLUG: Record<string, "and" | "or"> = {
  "party-games": "or",
  "parents-and-kids": "and",
  "a-party-of-points": "or",
};

type SavedSetup = {
  numGames: number;
  players: string[];
  categoryId?: number | null;
  tags: number[];
};

const STORAGE_KEY = "skg-setup";

export default function SetupPage() {
  const router = useRouter();

  // core state
  const [numGames, setNumGames] = useState(3);
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");

  // taxonomy state
  const [cats, setCats] = useState<TaxItem[]>([]);
  const [allTags, setAllTags] = useState<TaxItem[]>([]);
  const [visibleTags, setVisibleTags] = useState<TaxItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const [taxError, setTaxError] = useState<string | null>(null);
  const [catsLoading, setCatsLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(false);

  // load saved setup (best-effort)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved: SavedSetup = JSON.parse(raw);
      if (typeof saved?.numGames === "number") setNumGames(saved.numGames);
      if (Array.isArray(saved?.players)) setPlayers(saved.players);
      if (typeof saved?.categoryId === "number") setCategoryId(saved.categoryId);
      if (Array.isArray(saved?.tags)) setSelectedTagIds(saved.tags);
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    const saved: SavedSetup = {
      numGames,
      players,
      categoryId,
      tags: selectedTagIds,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch {}
  }, [numGames, players, categoryId, selectedTagIds]);

  // fetch categories + all tags once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCatsLoading(true);
        setTaxError(null);
        const { cats, tags } = await fetchTaxOptions();
        if (cancelled) return;
        const filteredCats = (cats || []).filter(
          (c) => (c.slug || "").toLowerCase() !== "uncategorized"
        );
        setCats(filteredCats);
        setAllTags(tags || []);
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setTaxError(e?.message || String(e));
      } finally {
        if (!cancelled) setCatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // when category changes, build the visibleTags list
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!categoryId) {
        setVisibleTags([]);
        return;
      }
      try {
        setTagsLoading(true);
        setTaxError(null);

        // Discover tags from posts in the selected category
        const discovered = await fetchTagsForCategory(categoryId);
        if (cancelled) return;

        // Determine curated list (if any) from category slug
        const cat = cats.find((c) => c.databaseId === categoryId);
        const slug = (cat?.slug || "").toLowerCase();
        const curatedSlugs = CURATED_VIBES[slug];

        let next: TaxItem[] = discovered;

        if (Array.isArray(curatedSlugs) && curatedSlugs.length > 0) {
          // Map for quick lookup
          const discoveredBySlug = new Map(
            discovered.map((t) => [t.slug.toLowerCase(), t])
          );
          const allBySlug = new Map(
            allTags.map((t) => [t.slug.toLowerCase(), t])
          );

          // Build curated list in the order specified, falling back to allTags
          const curatedList: TaxItem[] = [];
          for (const s of curatedSlugs) {
            const key = s.toLowerCase();
            const t = discoveredBySlug.get(key) || allBySlug.get(key);
            if (t && !curatedList.find((x) => x.databaseId === t.databaseId)) {
              curatedList.push(t);
            }
          }
          next = curatedList;
        }

        setVisibleTags(next);

        // Drop any selected tag that is no longer visible
        setSelectedTagIds((prev) =>
          prev.filter((id) => next.some((t) => t.databaseId === id))
        );
      } catch (e: any) {
        console.error(e);
        if (!cancelled) setTaxError(e?.message || String(e));
      } finally {
        if (!cancelled) setTagsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, cats, allTags]);

  // figure out tag mode for the selected category
  const tagMode = useMemo<"and" | "or" | null>(() => {
    if (!categoryId) return null;
    const cat = cats.find((c) => c.databaseId === categoryId);
    if (!cat) return null;
    const slug = (cat.slug || "").toLowerCase();
    return TAG_MODE_BY_CATEGORY_SLUG[slug] ?? "or";
  }, [categoryId, cats]);

  // helpers
  const disableStart = useMemo(
    () => players.length === 0 || numGames < 1,
    [players.length, numGames]
  );

  function addPlayer() {
    const name = newPlayer.trim();
    if (name && !players.includes(name)) {
      setPlayers([...players, name]);
      setNewPlayer("");
    }
  }
  function removePlayer(name: string) {
    setPlayers(players.filter((p) => p !== name));
  }
  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }
  function onChooseCategory(id: number) {
    setCategoryId(id);
    setSelectedTagIds([]); // reset vibes when playlist changes
  }

  function startGame() {
    const sessionId = Date.now().toString();
    try {
      localStorage.setItem("skg-current-session-id", sessionId);
    } catch {}
    const params = new URLSearchParams({
      count: String(numGames),
      players: players.join(","),
      sessionId,
    });
    if (categoryId) params.set("c", String(categoryId));
    if (selectedTagIds.length) params.set("t", selectedTagIds.join(","));
    if (tagMode) params.set("tm", tagMode);
    router.push(`/play/session?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Setup Game</h1>

      {/* Number of games + Players */}
      <section className="w-full max-w-2xl mb-8">
        <label className="block mb-2 font-semibold">Number of games</label>
        <input
          type="number"
          value={numGames}
          min={1}
          max={50}
          onChange={(e) => setNumGames(Number(e.target.value))}
          className="text-white px-2 py-1 rounded mb-4 bg-zinc-900 border border-white/10"
        />

        <label className="block mb-2 font-semibold">Players</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newPlayer}
            onChange={(e) => setNewPlayer(e.target.value)}
            placeholder="Enter name"
            className="flex-1 text-white px-2 py-1 rounded bg-zinc-900 border border-white/10"
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

      {/* Game Playlists (single select) */}
      <section className="w-full max-w-2xl mb-8">
        <h3 className="font-semibold mb-2">Game Playlists</h3>
        {catsLoading && <p className="text-sm opacity-70">Loading…</p>}
        {taxError && (
          <p className="text-sm opacity-75 mt-1">
            Could not load categories: {taxError}
          </p>
        )}
        {!catsLoading && !taxError && cats.length === 0 && (
          <p className="text-sm opacity-70">No categories found.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {cats.map((c) => (
            <label
              key={c.databaseId}
              className={`flex items-center gap-2 p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer ${
                categoryId === c.databaseId ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <input
                type="radio"
                name="category"
                checked={categoryId === c.databaseId}
                onChange={() => onChooseCategory(c.databaseId)}
              />
              <span>{c.name}</span>
            </label>
          ))}
        </div>

        {/* Game Vibe (only after a playlist is chosen) */}
        {categoryId && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Game Vibe</h3>
              {tagsLoading && <span className="text-xs opacity-70">Loading…</span>}
              {!tagsLoading && (
                <span className="text-xs opacity-70">
                  Mode: <strong>{(tagMode ?? "or").toUpperCase()}</strong>
                </span>
              )}
            </div>

            {!tagsLoading && visibleTags.length === 0 && (
              <p className="text-sm opacity-70 mt-2">
                No tags found for this playlist.
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {visibleTags.map((t) => (
                <label
                  key={t.databaseId}
                  className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(t.databaseId)}
                    onChange={() => toggleTag(t.databaseId)}
                  />
                  <span>{t.name}</span>
                </label>
              ))}
            </div>

            <p className="text-xs opacity-70 mt-2">
              Party Games vibes combine with <b>OR</b>; Parents and Kids combine with <b>AND</b>.
            </p>
          </div>
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
