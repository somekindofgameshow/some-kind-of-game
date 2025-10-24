"use client";

/**
 * Elementor-safe card renderer:
 * - Server: build a simple, safe fallback (p/ul/ol/li) from the HTML string.
 * - Client: sanitize full HTML with a broader allow-list (Elementor-friendly).
 * - If client sanitization returns empty, we KEEP the server fallback.
 */

import { useEffect, useMemo, useState } from "react";

type Props = {
  title: string;
  slug?: string;
  content?: string; // WordPress HTML (may be Elementor)
  excerpt?: string;
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

/** Strip all tags → plain text */
function stripTags(s = "") {
  return decodeEntities(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

/** Build simple p/ul/ol/li HTML on the server (regex only) */
function buildServerFallbackHtml(srcHtml: string, fallbackTitle: string) {
  const pMatches = Array.from(srcHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi));
  const olMatches = Array.from(srcHtml.matchAll(/<ol[^>]*>([\s\S]*?)<\/ol>/gi));
  const ulMatches = Array.from(srcHtml.matchAll(/<ul[^>]*>([\s\S]*?)<\/ul>/gi));

  const parts: string[] = [];

  if (pMatches.length === 0 && olMatches.length === 0 && ulMatches.length === 0) {
    const txt = stripTags(srcHtml);
    if (txt) {
      txt
        .split(/\n{2,}/)
        .map((t) => t.trim())
        .filter(Boolean)
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

  // Server fallback that always shows *some* readable content
  const serverHtml = useMemo(() => buildServerFallbackHtml(rawHtml, title), [rawHtml, title]);

  // Client sanitizer result (Elementor-friendly allow-list)
  const [clientHtml, setClientHtml] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const { default: DOMPurify } = await import("isomorphic-dompurify");
      const cleaned = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "p", "br", "strong", "em", "b", "i", "u", "span",
          "ul", "ol", "li", "blockquote", "hr", "code", "pre",
          "a", "img",
          // Elementor / theme wrappers
          "div", "section", "article", "header", "footer",
          "figure", "figcaption",
          // Headings
          "h1", "h2", "h3", "h4", "h5", "h6",
          // (optional) tables if you ever use them
          "table", "thead", "tbody", "tr", "td", "th"
        ],
        ALLOWED_ATTR: [
          "href", "title", "target", "rel",
          "src", "alt", "width", "height", "loading",
          "class", "id", "style",
          "aria-label", "role"
        ],
        ALLOW_DATA_ATTR: false,
      });
      if (!canceled) setClientHtml(cleaned);
    })();
    return () => { canceled = true; };
  }, [rawHtml]);

  // Prefer clientHtml only if it actually has content; otherwise keep the server fallback
  const finalHtml = clientHtml && clientHtml.trim().length > 0 ? clientHtml : serverHtml;

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
      {/* meta line */}
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

      {/* CONTENT: left aligned, preserve WP formatting */}
      <div
        className="
          text-left leading-relaxed text-pretty
          text-[clamp(16px,2.6vw,20px)]

          [&_p]:mb-4
          [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-3
          [&_h2]:text-xl  [&_h2]:font-semibold [&_h2]:mb-3
          [&_h3]:text-lg  [&_h3]:font-semibold [&_h3]:mb-2

          [&_ul]:list-disc   [&_ul]:pl-6 [&_ul>li]:mb-1
          [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:mb-1

          [&_blockquote]:italic [&_blockquote]:opacity-90 [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:ml-0

          [&_a]:underline

          [&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-72 [&_img]:object-contain

          [&_table]:w-full [&_table]:text-left [&_th]:font-semibold [&_td]:align-top [&_td]:py-1

          /* If Elementor injects text-align:center inline, force left */
          [&_p]:!text-left [&_div]:!text-left [&_section]:!text-left [&_span]:!text-left [&_li]:!text-left
        "
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      {/* footer note */}
      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
