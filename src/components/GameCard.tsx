"use client";

/**
 * Card that shows sanitized WP HTML.
 * - Server: render a safe, simple fallback (p/ul/ol/li) from the HTML string.
 * - Client: dynamically sanitize the full HTML and swap it in after hydrate.
 * - suppressHydrationWarning => no red overlay.
 */

import { useEffect, useMemo, useState } from "react";

type Props = {
  title: string;
  slug?: string;
  content?: string; // WordPress HTML
  excerpt?: string; // WordPress HTML
};

/** Minimal entity decoding */
function decodeEntities(s = "") {
  s = s.replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)));
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Strip all tags from a fragment */
function stripTags(s = "") {
  return decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/**
 * Build a very safe fallback HTML (p + ul/ol + li) using regex only.
 * This runs on the server so SSR always shows something readable.
 */
function buildServerFallbackHtml(srcHtml: string, fallbackTitle: string) {
  const pMatches = Array.from(srcHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const olMatches = Array.from(srcHtml.matchAll(/<ol[^>]*>([\s\S]*?)<\/ol>/gi));
  const ulMatches = Array.from(srcHtml.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/gi));

  const parts: string[] = [];

  if (pMatches.length === 0 && olMatches.length === 0 && ulMatches.length === 0) {
    const txt = stripTags(srcHtml);
    if (txt) {
      // split on blank lines
      txt.split(/\n{2,}/).map((t) => t.trim()).filter(Boolean)
        .forEach((t) => parts.push(`<p>${t}</p>`));
    } else {
      parts.push(`<p>${decodeEntities(fallbackTitle)}</p>`);
    }
  } else {
    pMatches.forEach((m) => {
      const text = stripTags(m[1]);
      if (text) parts.push(`<p>${text}</p>`);
    });

    const buildList = (inner: string, tag: "ul" | "ol") => {
      const li = Array.from(inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi))
        .map((m) => stripTags(m[1]))
        .filter(Boolean)
        .map((t) => `<li>${t}</li>`)
        .join("");
      if (li) parts.push(`<${tag}>${li}</${tag}>`);
    };

    ulMatches.forEach((m) => buildList(m[1], "ul"));
    olMatches.forEach((m) => buildList(m[1], "ol"));
  }

  return parts.join("\n");
}

export default function GameCard({ title, slug, content, excerpt }: Props) {
  const rawHtml = useMemo(() => content || excerpt || `<p>${title}</p>`, [content, excerpt, title]);

  // 1) Server fallback HTML (safe p/ul/ol/li only)
  const serverHtml = useMemo(() => buildServerFallbackHtml(rawHtml, title), [rawHtml, title]);

  // 2) Client sanitization (full allow-list incl. images/emojis)
  const [clientHtml, setClientHtml] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    (async () => {
      // dynamic import => runs only in the browser, not during SSR
      const { default: DOMPurify } = await import("isomorphic-dompurify");
      const cleaned = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "p",
          "br",
          "strong",
          "em",
          "b",
          "i",
          "u",
          "span",
          "ul",
          "ol",
          "li",
          "blockquote",
          "hr",
          "code",
          "pre",
          "a",
          "img",
          "h1",
          "h2",
          "h3",
          "h4",
        ],
        ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "width", "height", "loading"],
        ALLOW_DATA_ATTR: false,
      });
      if (!canceled) setClientHtml(cleaned);
    })();

    return () => {
      canceled = true;
    };
  }, [rawHtml]);

  // prefer the fully sanitized client HTML; SSR gets the safe server HTML
  const finalHtml = clientHtml ?? serverHtml;

  return (
    <article
      className="
        rounded-3xl shadow-2xl border border-white/10
        bg-black text-white
        p-6 sm:p-8 md:p-10
        max-w-xl mx-auto
        flex flex-col gap-4
      "
      aria-label={title}
      role="group"
    >
      {/* small pip + slug */}
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

      {/* Body */}
      <div
        className="
          text-center font-semibold leading-tight text-pretty
          text-[clamp(18px,3.0vw,26px)]
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-left [&_ul>li]:mb-2
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-left [&_ol>li]:mb-2
          [&_blockquote]:italic [&_blockquote]:opacity-90 [&_blockquote]:mx-auto [&_blockquote]:max-w-prose
          [&_a]:underline
          [&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-72 [&_img]:object-contain
        "
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {/* Footer title */}
      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
