import Link from "next/link";

console.log("API:", process.env.NEXT_PUBLIC_WORDPRESS_API_URL);


export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-6">Some Kind of Game</h1>
      <p className="text-gray-300 mb-6">Your Next.js + WordPress playground 🎮</p>

      <div className="flex gap-4">
        <Link
          href="/play/setup"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Go to Setup
        </Link>
        <Link
          href="/play/session"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md"
        >
          Go to Session
        </Link>
      </div>
    </main>
  );
}
