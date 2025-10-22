/* src/app/layout.tsx */
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
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
        {/* Header — 3-column grid keeps center perfectly centered */}
        <header className="skg-surface border-b skg-border px-4 py-3 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            {/* LEFT: Back to blog */}
            <div className="justify-self-start">
              <a
                href={blogUrl}
                className="skg-btn px-3 py-1 rounded-lg inline-flex items-center gap-2"
              >
                <span>←</span>
                <span>Back to Some Kind of Game</span>
              </a>
            </div>

            {/* CENTER: Banner image (clickable to blog) */}
            <div className="justify-self-center">
              <a href={blogUrl} aria-label="Back to Some Kind of Game (home)">
                {/* Provide natural width/height; CSS controls actual size */}
                <Image
                  src="/banner.png"
                  width={800}
                  height={200}
                  priority
                  alt="Some Kind of Game"
                  className="h-10 md:h-12 w-auto object-contain"
                />
              </a>
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
