"use client";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  title: string;
  slug?: string;
  content?: string; // WordPress HTML
  excerpt?: string; // WordPress HTML
};

export default function GameCard({ title, slug, content, excerpt }: Props) {
  const rawHtml = content || excerpt || `<p>${title}</p>`;

  // Sanitize with a conservative allow-list
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
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
    // Don’t allow iframes/scripts/etc. (keeps this card text-focused and safe)
  });

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
      {/* Small pip + slug (optional flavor) */}
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

      {/* The readable body */}
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
        // Safe because we sanitized above
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />

      {/* Footer title (subtle) */}
      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
