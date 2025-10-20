import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Some Kind of Game",
  description: "Party game web app powered by WordPress + Next.js",
};

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} skg-bg skg-text flex flex-col min-h-screen font-sans`}>
        {/* HEADER */}
        <header className="skg-surface border-b skg-border py-4 px-6 flex justify-between items-center sticky top-0 z-50">
          <Link
            href="/"
            className="text-2xl font-bold skg-accent hover:opacity-90 transition-colors"
          >
            Some Kind of Game
          </Link>
          <Link
            href="/play/setup"
            className="skg-btn font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            🎮 Play Now
          </Link>
        </header>

        {/* MAIN */}
        <main className="flex-grow flex flex-col items-center">{children}</main>

        {/* FOOTER */}
        <footer className="skg-surface border-t skg-border text-sm py-3 text-center">
          © {new Date().getFullYear()} Some Kind of Game — built with Next.js + WPGraphQL
        </footer>
      </body>
    </html>
  );
}
