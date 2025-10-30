/* src/app/layout.tsx */
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
// at top
import Image from "next/image";


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
        {/* Slim header bar */}
        <header className="skg-surface border-b skg-border sticky top-0 z-50">
          <div className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
            {/* LEFT: Home */}
            <div className="justify-self-start">
              <a
                href={blogUrl}
                className="skg-btn px-3 py-1 rounded-lg inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Home</span>
              </a>
            </div>

            {/* CENTER: Two-line headline */}
            
            <div className="justify-self-center text-center leading-tight">
              <div className="text-xs md:text-sm opacity-80">You&apos;re playing</div>
              <div className="text-base md:text-lg font-semibold">Some Kind of Game</div>
            </div>

            {/* RIGHT: New Game */}
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
