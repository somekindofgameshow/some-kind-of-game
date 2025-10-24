// src/app/play/session/page.tsx
import type { Game } from "@/types/game";
import { fetchGames, shuffle } from "@/lib/api";
import SessionClient from "@/components/SessionClient";

export default async function SessionPage({
  searchParams,
}: {
  searchParams: {
    count?: string;
    players?: string;
    sessionId?: string;
    c?: string; // category ids (databaseId)
    t?: string; // tag ids (databaseId)
  };
}) {
  const count = Number(searchParams.count || 3);
  const players = searchParams.players ? searchParams.players.split(",") : [];
  const initialSessionId = searchParams.sessionId;

  // Parse filters from query string
  const catIds =
    searchParams.c?.split(",").map((s) => Number(s)).filter(Boolean) || [];
  const tagIds =
    searchParams.t?.split(",").map((s) => Number(s)).filter(Boolean) || [];

  // WPGraphQL query: include databaseId + uri for commenting/embedding
  const query = `
    query PostsByFilters($cat: [ID], $tag: [ID], $first: Int!) {
      posts(first: $first, where: { categoryIn: $cat, tagIn: $tag }) {
        nodes {
          id
          databaseId
          title
          slug
          uri
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

  // Map raw nodes -> strongly typed Game[]
  const allGames: Game[] =
    (data?.posts?.nodes ?? []).map((n: any): Game => ({
      id: String(n?.id ?? ""),
      databaseId: Number(n?.databaseId ?? 0),
      title: String(n?.title ?? ""),
      slug: String(n?.slug ?? ""),
      uri: n?.uri ? String(n.uri) : undefined,
      content: n?.content ?? undefined,
      excerpt: n?.excerpt ?? undefined,
    })) || [];

  // Shuffle then take the requested count
  const games = shuffle(allGames).slice(0, count);

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <SessionClient
        games={games}
        players={players}
        initialSessionId={initialSessionId}
      />
    </main>
  );
}
