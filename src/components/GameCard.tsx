"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** --- Helpers ------------------------------------------------------------- */

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

function toPlainParagraphs(html?: string, fallbackTitle?: string) {
  if (!html) return `<p>${fallbackTitle ?? ""}</p>`;
  const text = decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  if (!text) return `<p>${fallbackTitle ?? ""}</p>`;
  return text.split(/\n{2,}/).map((t) => `<p>${t.trim()}</p>`).join("\n");
}

type ExtractResult = {
  safeHtmlWithSlots: string;
  widgets: Array<{ slot: string; srcdoc: string }>;
};

/**
 * Build a minimal HTML document for the iframe.
 * - Includes a base tag so relative assets (if any) resolve.
 * - Includes a small auto-resize script to post height to parent.
 */
function buildSrcDoc(blockHtml: string, baseHref: string) {
  const cssReset = `
    html,body{margin:0;padding:0}
    body{font:inherit;font-family:system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial,sans-serif;background:#fff;color:#000;padding:8px}
    button{font:inherit;cursor:pointer}
  `;
  const autoResize = `
    <script>
      (function(){
        function postH(){
          var h = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
          parent.postMessage({__skg_iframe:true,h:h}, "*");
        }
        window.addEventListener("load", postH);
        new MutationObserver(postH).observe(document.documentElement,{subtree:true,childList:true,attributes:true,characterData:true});
        window.addEventListener("resize", postH);
      })();
    </script>
  `;
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <base href="${baseHref}">
      <style>${cssReset}</style>
    </head>
    <body>
      ${blockHtml}
      ${autoResize}
    </body>
  </html>`;
}

/**
 * Parse the raw WordPress HTML and:
 *  - Replace known widget blocks with placeholder slots: <div data-skg-slot="n"></div>
 *  - Return a list of widgets, each providing an iframe srcdoc for that slot.
 *
 * Preferred markup in WP is a wrapper:
 *   <div data-skg-widget="random-object"> ... HTML + <style> + <script> ... </div>
 *
 * Fallback included for your current pattern:
 *   .random-object-generator  (+ #word-bank + nearby <style>/<script>)
 */
function extractWidgetsFromHtml(rawHtml: string, baseHref: string): ExtractResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  const widgets: ExtractResult["widgets"] = [];
  let slotIndex = 0;

  // A) Preferred: any wrapper with data-skg-widget
  const widgetWrappers = Array.from(doc.querySelectorAll<HTMLElement>("[data-skg-widget]"));

  widgetWrappers.forEach((wrapper) => {
    const slot = `skg-slot-${slotIndex++}`;
    const html = wrapper.outerHTML; // includes any <style>/<script> inside
    const srcdoc = buildSrcDoc(html, baseHref);

    const placeholder = doc.createElement("div");
    placeholder.setAttribute("data-skg-slot", slot);
    wrapper.replaceWith(placeholder);

    widgets.push({ slot, srcdoc });
  });

  // B) Fallback: your existing random-object block
  // Look for main generator div, pull in sibling #word-bank, and the nearest <style>/<script>
  if (widgetWrappers.length === 0) {
    const gen = doc.querySelector<HTMLElement>(".random-object-generator");
    if (gen) {
      const frag = doc.createElement("div");
      frag.appendChild(gen.cloneNode(true));

      const bank = doc.querySelector<HTMLElement>("#word-bank");
      if (bank) frag.appendChild(bank.cloneNode(true));

      // Attach first style & script following the generator (best-effort)
      let foundStyle: HTMLStyleElement | null = null;
      let foundScript: HTMLScriptElement | null = null;

      // search siblings first
      let n: ChildNode | null = gen.nextSibling;
      let guard = 0;
      while (n && guard++ < 20 && (!foundStyle || !foundScript)) {
        if ((n as HTMLElement).tagName === "STYLE" && !foundStyle) foundStyle = n as HTMLStyleElement;
        if ((n as HTMLElement).tagName === "SCRIPT" && !foundScript) foundScript = n as HTMLScriptElement;
        n = n.nextSibling;
      }
      // fallback to document-level search if not found
      if (!foundStyle) foundStyle = doc.querySelector("style");
      if (!foundScript) foundScript = doc.querySelector("script");

      if (foundStyle) frag.appendChild(foundStyle.cloneNode(true));
      if (foundScript) frag.appendChild(foundScript.cloneNode(true));

      const slot = `skg-slot-${slotIndex++}`;
      const srcdoc = buildSrcDoc(frag.innerHTML, baseHref);

      // remove originals from document so they don't show twice
      gen.remove();
      if (bank?.isConnected) bank.remove();
      foundStyle?.remove();
      foundScript?.remove();

      const placeholder = doc.createElement("div");
      placeholder.setAttribute("data-skg-slot", slot);
      // insert placeholder where generator was
      const body = doc.body;
      body.appendChild(placeholder);

      widgets.push({ slot, srcdoc });
    }
  }

  const safeHtmlWithSlots = doc.body.innerHTML;
  return { safeHtmlWithSlots, widgets };
}

/** --- Component ----------------------------------------------------------- */

type Props = {
  title: string;
  slug?: string;
  content?: string;
  excerpt?: string;
};

export default function GameCard({ title, slug, content, excerpt }: Props) {
  const rawHtml = useMemo(() => content || excerpt || `<p>${title}</p>`, [content, excerpt, title]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Build sanitized HTML (no scripts) *with* widget placeholders + the iframe srcdocs
  const [processed, setProcessed] = useState<ExtractResult | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const { default: DOMPurify } = await import("isomorphic-dompurify");

      // IMPORTANT: We extract widgets from the raw HTML first,
      // because we need to keep their <script> for the iframe.
      const baseHref = (process.env.NEXT_PUBLIC_WORDPRESS_BASE_URL as string) || "https://somekindofgame.com";
      const { safeHtmlWithSlots, widgets } = extractWidgetsFromHtml(rawHtml, baseHref);

      // Now sanitize the HTML-with-slots (scripts should be gone)
      const cleaned = DOMPurify.sanitize(safeHtmlWithSlots, {
        ALLOWED_TAGS: [
          "p","br","strong","em","b","i","u","span","ul","ol","li","blockquote","hr","code","pre",
          "a","img","div","section","article","header","footer","figure","figcaption",
          "h1","h2","h3","h4","h5","h6","table","thead","tbody","tr","td","th"
        ],
        ALLOWED_ATTR: [
          "href","title","target","rel","src","alt","width","height","loading",
          "class","id","style","data-skg-slot","aria-*","role"
        ],
        ALLOW_DATA_ATTR: true,
      });

      if (!canceled) {
        setProcessed({
          safeHtmlWithSlots: cleaned || toPlainParagraphs(rawHtml, title),
          widgets,
        });
      }
    })();
    return () => { canceled = true; };
  }, [rawHtml, title]);

  // Inject iframes into placeholders and auto-resize
  useEffect(() => {
    if (!processed || !containerRef.current) return;

    const host = containerRef.current;

    // listener for resize messages
    function onMsg(e: MessageEvent) {
      const data = e.data as any;
      if (!data || !data.__skg_iframe) return;
      // set the height of the last created iframe that sent a message
      // (we’ll tag each iframe to be precise)
      const iframe = host.querySelector<HTMLIFrameElement>('iframe[data-skg-iframe="pending"]');
      if (iframe) {
        iframe.style.height = Math.max(120, Number(data.h || 0)) + "px";
        iframe.setAttribute("data-skg-iframe", "ready");
      }
    }
    window.addEventListener("message", onMsg);

    // mount iframes
    processed.widgets.forEach(({ slot, srcdoc }) => {
      const slotEl = host.querySelector<HTMLElement>(`[data-skg-slot="${slot}"]`);
      if (!slotEl) return;
      // create a sandboxed iframe
      const iframe = document.createElement("iframe");
      iframe.setAttribute("sandbox", "allow-scripts"); // no same-origin, no top nav, safe
      iframe.setAttribute("referrerpolicy", "no-referrer");
      iframe.setAttribute("data-skg-iframe", "pending");
      iframe.style.width = "100%";
      iframe.style.border = "0";
      iframe.style.display = "block";
      iframe.style.background = "#fff";
      iframe.srcdoc = srcdoc;

      slotEl.replaceWith(iframe);
    });

    return () => {
      window.removeEventListener("message", onMsg);
    };
  }, [processed]);

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
        ref={containerRef}
        className="
          text-left leading-relaxed text-pretty
          text-[clamp(16px,2.6vw,20px)]
          [&_p]:mb-4
          [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6
          [&_blockquote]:italic [&_blockquote]:opacity-90 [&_blockquote]:border-l [&_blockquote]:pl-4
          [&_a]:underline
          [&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-4 [&_img]:max-h-72 [&_img]:object-contain
        "
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: processed?.safeHtmlWithSlots ?? toPlainParagraphs(rawHtml, title),
        }}
      />

      <div className="mt-2 text-xs opacity-70 text-left">{title}</div>
    </article>
  );
}
