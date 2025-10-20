import { fetchGames, shuffle } from "@/lib/api";
import GameCard from "@/components/GameCard";
import ClientScoreBoard from "@/components/ClientScoreBoard";

type Game = {
  id: string;
  title: string;
  slug: string;
  content?: string;
};

export default async function SessionPage({
  searchParams,
}: {
  searchParams: {
    count?: string;
    players?: string;
    sessionId?: string;
    c?: string; // comma-separated category IDs
    t?: string; // comma-separated tag IDs
  };
}) {
  const count = Number(searchParams.count || 3);
  const players = searchParams.players ? searchParams.players.split(",") : [];
  const initialSessionId = searchParams.sessionId;

  const catIds =
    searchParams.c?.split(",").map((s) => Number(s)).filter(Boolean) || [];
  const tagIds =
    searchParams.t?.split(",").map((s) => Number(s)).filter(Boolean) || [];

  const query = `
    query PostsByFilters($cat: [ID], $tag: [ID], $first: Int!) {
      posts(first: $first, where: { categoryIn: $cat, tagIn: $tag }) {
        nodes {
          id
          title
          slug
          content
        }
      }
    }
  `;

  const variables = {
    cat: catIds.length ? catIds : null,
    tag: tagIds.length ? tagIds : null,
    first: 50,
  };

  const data = await fetchGames(query, variables);
  const allGames: Game[] = data?.posts?.nodes ?? [];
  const games = shuffle(allGames).slice(0, count);

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-4">Game Session</h1>
      <p className="text-gray-400 mb-6">
        Playing {count} random games
        {players.length ? ` with ${players.join(", ")}` : ""}.
      </p>

      {/* Selected filters info */}
      {(catIds.length > 0 || tagIds.length > 0) && (
        <p className="opacity-80 mb-4 text-sm">
          Filters: {catIds.length ? `Categories(${catIds.join(", ")}) ` : ""}
          {tagIds.length ? `Tags(${tagIds.join(", ")})` : ""}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 w-full max-w-6xl">
        {games.map((game) => (
          <GameCard
            key={game.id}
            title={game.title}
            slug={game.slug}
            content={game.content}
          />
        ))}
        {games.length === 0 && (
          <p className="opacity-75">No games match the selected filters.</p>
        )}
      </div>

      <div className="mt-10 w-full max-w-md">
        <ClientScoreBoard
          players={players}
          initialSessionId={initialSessionId}
        />
      </div>
    </main>
  );
}
