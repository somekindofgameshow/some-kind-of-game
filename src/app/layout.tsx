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
  const blogUrl =
    process.env.NEXT_PUBLIC_BLOG_URL || "https://somekindofgame.com";

  return (
    <html lang="en">
      <body className="bg-black text-white flex flex-col min-h-screen font-sans">
        {/* Header — 3-column grid keeps center perfectly centered */}
        <header className="skg-surface border-b skg-border px-4 py-3 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* LEFT */}
            <div className="justify-self-start">
              <a
                href={blogUrl}
                className="skg-btn px-3 py-1 rounded-lg inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Some Kind of Game</span>
              </a>
            </div>

            {/* CENTER — scoreboard gets portaled here */}
            <div
              id="header-scoreboard-slot"
              className="justify-self-center"
              /* hidden on very small screens if you prefer:
               * className="hidden sm:block justify-self-center"
               */
            />

            {/* RIGHT */}
            <div className="justify-self-end">
              <Link href="/play/setup" className="skg-btn px-3 py-1 rounded-lg">
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
