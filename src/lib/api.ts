// src/lib/api.ts

/** ------------------------------------------------------------------------
 * Endpoint resolution (server/client friendly)
 * --------------------------------------------------------------------- */
function getGraphQLEndpoint() {
  // Prefer explicit endpoints if provided
  const serverEnv = process.env.WORDPRESS_API_URL || process.env.WP_BASE_URL;
  const clientEnv =
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL || process.env.WP_BASE_URL;

  // On the server, prefer WORDPRESS_API_URL (or WP_BASE_URL + /graphql)
  if (typeof window === "undefined") {
    if (process.env.WORDPRESS_API_URL) return process.env.WORDPRESS_API_URL;
    if (process.env.NEXT_PUBLIC_WORDPRESS_API_URL)
      return process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
    if (serverEnv) return serverEnv.replace(/\/$/, "") + "/graphql";
  }

  // In the browser, prefer NEXT_PUBLIC_WORDPRESS_API_URL
  if (process.env.NEXT_PUBLIC_WORDPRESS_API_URL)
    return process.env.NEXT_PUBLIC_WORDPRESS_API_URL;
  if (clientEnv) return clientEnv.replace(/\/$/, "") + "/graphql";

  throw new Error(
    "No WordPress GraphQL endpoint configured. Set NEXT_PUBLIC_WORDPRESS_API_URL or WORDPRESS_API_URL (or WP_BASE_URL)."
  );
}

/** ------------------------------------------------------------------------
 * Low-level GraphQL helper
 * --------------------------------------------------------------------- */
async function graphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const endpoint = getGraphQLEndpoint();

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // cache a bit; adjust as needed
  });

  if (!res.ok) {
    throw new Error(`WordPress API returned ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    // Surface errors in dev; still throw to stop the request
    console.error(json.errors);
    throw new Error("GraphQL query failed.");
  }

  return json.data as T;
}

/** ------------------------------------------------------------------------
 * Existing export (kept for compatibility)
 * --------------------------------------------------------------------- */
export async function fetchGames(query: string, variables: any = {}) {
  return graphQL(query, variables);
}

/** ------------------------------------------------------------------------
 * Taxonomy options (Categories + Tags)
 * - Used by /play/setup for the filter UI
 * --------------------------------------------------------------------- */
export type TaxItem = {
  id: string;           // WP GraphQL global ID
  databaseId: number;   // numeric DB ID (handy for URLs/filters)
  name: string;
  slug: string;
};

export async function fetchTaxOptions(): Promise<{ cats: TaxItem[]; tags: TaxItem[] }> {
  const query = /* GraphQL */ `
    query TaxOptions {
      categories(first: 100, where: { hideEmpty: true }) {
        nodes { id databaseId name slug }
      }
      tags(first: 100, where: { hideEmpty: true }) {
        nodes { id databaseId name slug }
      }
    }
  `;

  const data = await graphQL<{
    categories: { nodes: TaxItem[] };
    tags: { nodes: TaxItem[] };
  }>(query);

  return {
    cats: data?.categories?.nodes ?? [],
    tags: data?.tags?.nodes ?? [],
  };
}

/** ------------------------------------------------------------------------
 * Fetch tags that actually occur on posts within a given Category (DATABASE_ID)
 * Used to show only relevant tags once a playlist/category is selected
 * --------------------------------------------------------------------- */
export async function fetchTagsForCategory(categoryDbId: number): Promise<TaxItem[]> {
  const query = /* GraphQL */ `
    query TagsForCategory($catId: ID!) {
      category(id: $catId, idType: DATABASE_ID) {
        posts(first: 200) {
          nodes {
            tags(first: 100) {
              nodes { id databaseId name slug }
            }
          }
        }
      }
    }
  `;

  // Reuse the existing GraphQL helper
  const data = await fetchGames(query, { catId: categoryDbId });

  const posts = data?.category?.posts?.nodes ?? [];
  const map = new Map<number, TaxItem>();
  for (const p of posts) {
    const tnodes: TaxItem[] = p?.tags?.nodes ?? [];
    for (const t of tnodes) {
      if (!map.has(t.databaseId)) map.set(t.databaseId, t);
    }
  }
  return Array.from(map.values());
}

/** ------------------------------------------------------------------------
 * Optional convenience for the Session page:
 * Fetch posts using Category + Tags with tag mode AND/OR.
 *
 * If tagMode === "or": use tagIn + categoryIn
 * If tagMode === "and": use taxQuery with multiple tag terms (AND)
 * --------------------------------------------------------------------- */
export type TagMode = "and" | "or";

export async function fetchPostsByFilters(params: {
  first: number;
  categoryId?: number | null;
  tagIds?: number[] | null;
  tagMode?: TagMode; // "or" default; "and" for Parents-and-Kids case
}) {
  const { first, categoryId, tagMode = "or" } = params;

  // Normalize tagIds to a real array so TS and runtime are safe
  const tagList: number[] = Array.isArray(params.tagIds) ? params.tagIds : [];

  const variables: Record<string, any> = { first };
  let query: string;

  if (tagMode === "and" && tagList.length > 1) {
    // Use taxQuery to require ALL selected tags
    variables.taxQuery = {
      relation: "AND",
      queries: [
        ...(categoryId
          ? [
              {
                taxonomy: "CATEGORY",
                terms: [categoryId],
                operator: "IN",
              },
            ]
          : []),
        ...tagList.map((tid) => ({
          taxonomy: "TAG",
          terms: [tid],
          operator: "IN",
        })),
      ],
    };

    query = /* GraphQL */ `
      query PostsByTaxQuery($first: Int!, $taxQuery: [TaxQuery]) {
        posts(first: $first, where: { taxQuery: $taxQuery }) {
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
  } else {
    // Default OR behavior (or single tag): categoryIn + tagIn
    variables.cat = categoryId ? [categoryId] : null;
    variables.tag = tagList.length ? tagList : null;

    query = /* GraphQL */ `
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
  }

  const data = await fetchGames(query, variables);
  return data.posts.nodes;
}

/** ------------------------------------------------------------------------
 * Utility: Fisher-Yates shuffle (kept)
 * --------------------------------------------------------------------- */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
