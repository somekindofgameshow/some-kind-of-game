"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  slug?: string;
  content?: string;  // WP HTML
  excerpt?: string;
  uri?: string;
};

export default function GameCard({ title, slug, content, excerpt }: Props) {
  const rawHtml = useMemo(
    () => content || excerpt || `<p>${title}</p>`,
    [content, excerpt, title]
  );

  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { default: DOMPurify } = await import("isomorphic-dompurify");

      const cleaned = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          "p","br","strong","em","b","i","u","span","div","section","article","header","footer",
          "ul","ol","li","blockquote","hr","code","pre","figure","figcaption",
          "a","img","table","thead","tbody","tr","td","th","h1","h2","h3","h4","h5","h6",
          "button","style","script"
        ],
        ALLOWED_ATTR: [
          "href","title","target","rel",
          "src","alt","width","height","loading",
          "class","id","style","onclick"
        ],
        ALLOW_DATA_ATTR: true,
        KEEP_CONTENT: true
      });

      if (!cancelled) setSanitizedHtml(cleaned);
    })();
    return () => { cancelled = true; };
  }, [rawHtml]);

  // NO forced text alignment — WP controls layout
  const srcDoc = useMemo(() => {
    const baseCSS = `
      :root { color-scheme: light; }
      html,body { margin:0; padding:0; background: transparent; }
      body {
        font-family: system-ui, sans-serif;
        line-height: 1.55;
        color: #e5e7eb;
        background: transparent;
      }
      img { max-width: 100%; height: auto; border-radius: 0.5rem; }
      a { color: #60a5fa; }
    `;

    const autoresizeJS = `
      (function () {
        function sendHeight() {
          var h = Math.max(
            document.documentElement.scrollHeight || 0,
            document.body ? document.body.scrollHeight : 0
          );
          parent.postMessage({ type: "skg-iframe-height", height: h }, "*");
        }
        window.addEventListener("load", sendHeight);
        new (window.ResizeObserver || function(fn){ setInterval(fn, 250); })(sendHeight)
          .observe(document.documentElement);
      })();
    `;

    return `<!doctype html>
<html>
<head><meta charset="utf-8" /><style>${baseCSS}</style></head>
<body>
  <main>${sanitizedHtml}</main>
  <script>${autoresizeJS}</script>
</body>
</html>`;
  }, [sanitizedHtml]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "skg-iframe-height") {
        const h = Math.max(180, Number(e.data.height || 0));
        if (iframeRef.current) {
          iframeRef.current.style.height = `${h}px`;
          setLoaded(true);
        }
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <article
      className="rounded-3xl shadow-2xl border border-white/10 bg-black text-white p-6 sm:p-8 md:p-10 max-w-xl mx-auto flex flex-col gap-4"
      aria-label={title}
      role="group"
    >
      <div className="flex items-center gap-2 text-xs opacity-70">
        <div className="h-3 w-3 rounded-full bg-white/70" />
        {slug && <span className="truncate">{slug}</span>}
      </div>

      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs opacity-70">Loading…</div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title={title}
          sandbox="allow-scripts allow-forms allow-popups"
          srcDoc={srcDoc}
          style={{ width: "100%", height: 200, border: "none", overflow: "hidden" }}
        />
      </div>

      <div className="mt-2 text-xs opacity-70">{title}</div>
    </article>
  );
}
