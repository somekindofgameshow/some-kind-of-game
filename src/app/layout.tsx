/* src/app/layout.tsx */
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Some Kind of Game",
  description: "Party game launcher",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If you want to use an env var for blog URL, set NEXT_PUBLIC_BLOG_URL in Vercel.
  const blogUrl =
    process.env.NEXT_PUBLIC_BLOG_URL || "https://somekindofgame.com";

  return (
    <html lang="en">
      <body
        className={`bg-black text-white flex flex-col min-h-screen font-sans`}
      >
        {/* Header */}
        <header className="skg-surface border-b skg-border px-4 py-3 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            {/* LEFT: Back button — replaces big site title */}
            <div className="flex items-center gap-3">
              <a
                href={blogUrl}
                className="skg-btn px-3 py-1 rounded-lg inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Some Kind of Game</span>
              </a>
            </div>

            {/* RIGHT: scoreboard portal slot + New Game */}
            <div className="flex items-center gap-3">
              {/* The session page will portal the Scoreboard here */}
              <div id="header-scoreboard-slot" className="hidden md:block" />

              <Link
                href="/play/setup"
                className="skg-btn px-3 py-1 rounded-lg"
              >
                New Game
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
