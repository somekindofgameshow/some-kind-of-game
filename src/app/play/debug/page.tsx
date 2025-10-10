// src/app/play/debug/page.tsx
import { fetchGames } from "@/lib/api";

export default async function DebugPage() {
  const query = `
    {
      posts(first: 5) {
        nodes {
          id
          title
          slug
        }
      }
    }
  `;

  let posts: { id: string; title: string; slug: string }[] = [];

  try {
    const data = await fetchGames(query);
    posts = data.posts.nodes;
  } catch (error) {
    console.error("Fetch failed:", error);
  }

  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">Debug – WordPress Posts</h1>
      {posts.length > 0 ? (
        <ul className="list-disc pl-6 space-y-2">
          {posts.map((post) => (
            <li key={post.id}>{post.title}</li>
          ))}
        </ul>
      ) : (
        <p>No posts found or fetch failed.</p>
      )}
    </main>
  );
}
