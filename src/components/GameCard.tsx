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
        // Expanded allow-list to keep Elementor text & structure
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
          "class", "id", "style", // keep lightweight styling/classnames from Elementor
          "aria-label", "role"
        ],
        ALLOW_DATA_ATTR: false,
        // note: DOMPurify will strip disallowed tags but keep their text content
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
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

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
          [&_div]:mb-3 [&_section]:mb-3  /* Elementor wrappers get spacing */
        "
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />

      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
