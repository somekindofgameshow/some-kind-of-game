import { fetchGames, shuffle } from "@/lib/api";
import GameCard from "@/components/GameCard";
import ScoreBoard from "@/components/ScoreBoard";
import { Suspense } from "react";

type Game = {
  id: string;
  title: string;
  slug: string;
  content?: string;
};

export default async function SessionPage({
  searchParams,
}: {
  searchParams: { count?: string; players?: string };
}) {
  const count = Number(searchParams.count || 3);
  const players = searchParams.players
    ? searchParams.players.split(",")
    : [];

  const query = `
    {
      posts(first: 20) {
        nodes {
          id
          title
          slug
          content
        }
      }
    }
  `;

  const data = await fetchGames(query);
  const allGames: Game[] = data.posts.nodes;
  const games = shuffle(allGames).slice(0, count);

  return (
    // 🟢 STEP 3 (Optional visual polish): Replace your old <main> line with this one
    <main className="min-h-screen flex flex-col items-center p-8 text-white bg-gradient-to-b from-gray-900 to-black">
      <h1 className="text-3xl font-bold mb-4">Game Session</h1>
      <p className="text-gray-400 mb-6">
        Playing {count} random games with {players.join(", ")}.
      </p>

      {/* 🟢 STEP 2 (Grid layout): Replace your old map() with this */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-6xl">
        {games.map((game) => (
          <GameCard
            key={game.id}
            title={game.title}
            slug={game.slug}
            content={game.content}
          />
        ))}
      </div>

      {/* 🟣 BONUS (Center scoreboard): Put this block BELOW the grid */}
      <div className="mt-10 w-full max-w-md">
        <ScoreBoard players={players} />
      </div>
    </main>
  );
}
