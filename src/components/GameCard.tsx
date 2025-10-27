"use client";

import { useMemo, useState } from "react";

type Props = {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  uri?: string; // e.g. "/family-game-night/sweet-nothings/" or full URL
};

// If you prefer, set NEXT_PUBLIC_WP_BASE_URL in Vercel.
// Otherwise we use your domain by default.
const WP_BASE =
  process.env.NEXT_PUBLIC_WP_BASE_URL || "https://somekindofgame.com";

/**
 * Build an absolute URL for the iframe:
 * - If `uri` starts with "http", use it as-is.
 * - If it starts with "/", prepend WP_BASE.
 * - Otherwise, return null (so we fallback to sanitized content).
 */
function buildPostUrl(uri?: string) {
  if (!uri) return null;
  if (/^https?:\/\//i.test(uri)) return uri;
  if (uri.startsWith("/")) return `${WP_BASE}${uri}`;
  return null;
}

export default function GameCard({ title, slug, content, excerpt, uri }: Props) {
  const postUrl = useMemo(() => buildPostUrl(uri), [uri]);

  // Simple height controls so people can expand if needed
  const [mode, setMode] = useState<"short" | "tall" | "fill">("tall");
  const height =
    mode === "short" ? 520 : mode === "tall" ? 800 : "calc(100vh - 220px)";

  return (
    <article
      className="
        rounded-3xl shadow-2xl border border-white/10
        bg-black text-white
        p-4 sm:p-6 md:p-8
        max-w-xl mx-auto
        flex flex-col gap-4
      "
      aria-label={title}
      role="group"
    >
      {/* meta line */}
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

      {postUrl ? (
        <>
          {/* Controls */}
          <div className="flex items-center justify-between text-sm opacity-85">
            <div className="font-semibold">{title}</div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Height:</span>
              <button
                className={`px-2 py-1 rounded-lg ${
                  mode === "short" ? "skg-btn" : "bg-gray-600 text-white"
                }`}
                onClick={() => setMode("short")}
              >
                Short
              </button>
              <button
                className={`px-2 py-1 rounded-lg ${
                  mode === "tall" ? "skg-btn" : "bg-gray-600 text-white"
                }`}
                onClick={() => setMode("tall")}
              >
                Tall
              </button>
              <button
                className={`px-2 py-1 rounded-lg ${
                  mode === "fill" ? "skg-btn" : "bg-gray-600 text-white"
                }`}
                onClick={() => setMode("fill")}
              >
                Fill
              </button>
            </div>
          </div>

          {/* The embedded post */}
          <div className="rounded-2xl overflow-hidden skg-border">
            <iframe
              title={title}
              src={postUrl}
              style={{
                width: "100%",
                height: typeof height === "number" ? `${height}px` : height,
                border: "0",
              }}
              loading="lazy"
              // Don’t add allow-same-origin unless you truly need it.
              // (It grants more power to the iframe content.)
              sandbox="
                allow-forms
                allow-popups
                allow-popups-to-escape-sandbox
                allow-scripts
                allow-top-navigation-by-user-activation
              "
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* direct link (in case the iframe is blocked by headers/plugins) */}
          <a
            href={postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline opacity-80"
          >
            Open this game post in a new tab ↗
          </a>
        </>
      ) : (
        // Fallback: show your previously sanitized content path
        <div
          className="
            text-left leading-relaxed text-pretty
            [&_p]:mb-4
          "
          dangerouslySetInnerHTML={{
            __html: content || excerpt || `<p>${title}</p>`,
          }}
        />
      )}

      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
