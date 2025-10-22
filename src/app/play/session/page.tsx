import { fetchGames, shuffle } from "@/lib/api";
import SessionClient from "@/components/SessionClient";

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
    c?: string; // category ids
    t?: string; // tag ids
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
        content(format: RENDERED)
        excerpt(format: RENDERED)
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
      
      

      {/* NEW: One-at-a-time flow with sticky scoreboard */}
      <SessionClient
        games={games}
        players={players}
        initialSessionId={initialSessionId}
      />
    </main>
  );
}