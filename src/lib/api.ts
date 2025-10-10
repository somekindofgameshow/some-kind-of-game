// src/lib/api.ts
export async function fetchGames(query: string, variables: any = {}) {
  const endpoint =
    typeof window === "undefined"
      ? process.env.WORDPRESS_API_URL
      : process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

  const res = await fetch(endpoint as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // optional caching
  });

  if (!res.ok) {
    throw new Error(`WordPress API returned ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error("GraphQL query failed.");
  }

  return json.data;
}

// src/lib/api.ts

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
