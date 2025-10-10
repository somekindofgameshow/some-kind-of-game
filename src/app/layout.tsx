import "./globals.css";
import Link from "next/link";
import { Inter } from "next/font/google";

export const metadata = {
  title: "Some Kind of Game",
  description: "Party game web app powered by WordPress + Next.js",
};

// 🧩 Load Inter font
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black text-white flex flex-col min-h-screen font-sans`}
      >
        {/* 🟢 HEADER */}
        <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 py-4 px-6 flex justify-between items-center sticky top-0 z-50">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Some Kind of Game
          </Link>

          <Link
            href="/play/setup"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
          >
            🎮 Play Now
          </Link>
        </header>

        {/* 🟢 MAIN CONTENT */}
        <main className="flex-grow flex flex-col items-center">{children}</main>

        {/* 🟢 FOOTER */}
        <footer className="bg-gray-900/80 backdrop-blur-md border-t border-gray-800 text-gray-400 text-sm py-3 text-center">
          © {new Date().getFullYear()} Some Kind of Game — built with Next.js + WPGraphQL
        </footer>
      </body>
    </html>
  );
}
