// src/components/FloatingFooter.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Floating footer:
 * - Expanded: full-width panel, centered content
 * - Collapsed: full-width header-style bar with title + Show button
 * - Auto-collapses on small screens by default (unless user chose otherwise)
 * - Persists per sessionKey
 */
export default function FloatingFooter({
  children,
  sessionKey = "default",
  breakpointPx = 768, // Tailwind md
  title = "Scoreboard",
  showLabel = "Show",
  hideLabel = "Hide",
}: {
  children: React.ReactNode;
  sessionKey?: string;
  breakpointPx?: number;
  title?: string;
  showLabel?: string;
  hideLabel?: string;
}) {
  const collapsedKey = `skg-footer-collapsed-${sessionKey}`;
  const userPrefKey = `skg-footer-userpref-${sessionKey}`;
  const [collapsed, setCollapsed] = useState(false);
  const userPrefSet = useRef(false);

  // initial
  useEffect(() => {
    try {
      const saved = localStorage.getItem(collapsedKey);
      const up = localStorage.getItem(userPrefKey);
      userPrefSet.current = up === "1";
      if (saved !== null) {
        setCollapsed(saved === "1");
      } else {
        setCollapsed(typeof window !== "undefined" && window.innerWidth < breakpointPx);
      }
    } catch {}
  }, [breakpointPx, collapsedKey, userPrefKey]);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(collapsedKey, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, collapsedKey]);

  // responsive auto-collapse if user hasn't chosen yet
  useEffect(() => {
    function onResize() {
      if (userPrefSet.current) return;
      setCollapsed(window.innerWidth < breakpointPx);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpointPx]);

  function setCollapsedByUser(next: boolean) {
    userPrefSet.current = true;
    try { localStorage.setItem(userPrefKey, "1"); } catch {}
    setCollapsed(next);
  }

  const panelClasses = useMemo(
    () =>
      [
        "rounded-t-2xl",
        "bg-zinc-900/85",
        "backdrop-blur",
        "border",
        "border-white/10",
        "shadow-2xl",
        "transition-[transform,opacity]",
        "duration-200",
        "ease-out",
        collapsed ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100 translate-y-0",
      ].join(" "),
    [collapsed]
  );

  // Shared outer container pinned to bottom via FooterPortal wrapper
  return (
    <div className="pointer-events-auto">
      <div className="w-full px-3 pb-3">
        {/* Collapsed bar (header-like) */}
        {collapsed && (
          <div
            className="rounded-t-xl bg-zinc-900/85 backdrop-blur border border-white/10 shadow-lg"
            role="button"
            aria-label={`${title} collapsed bar`}
            // Clicking the bar (except the button) also opens
            onClick={(e) => {
              // avoid double-trigger when clicking the button
              const isButton = (e.target as HTMLElement).closest("button");
              if (!isButton) setCollapsedByUser(false);
            }}
          >
            <div className="mx-auto max-w-5xl px-3 py-2 flex items-center justify-between">
              <div className="text-xs opacity-80">{title}</div>
              <button
                className="skg-btn px-3 py-1 rounded-md text-xs"
                onClick={() => setCollapsedByUser(false)}
                aria-label="Show scoreboard"
              >
                {showLabel}
              </button>
            </div>
          </div>
        )}

        {/* Expanded panel */}
        <div className={panelClasses} aria-hidden={collapsed}>
          <div className="mx-auto max-w-5xl px-3 py-2 flex items-center justify-between">
            <div className="text-xs opacity-80">{title}</div>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
              onClick={() => setCollapsedByUser(true)}
              aria-label="Hide scoreboard"
            >
              {hideLabel}
            </button>
          </div>

          <div className="px-3 pb-3">
            <div className="w-full flex justify-center">
              {/* make child full-width or constrain; choose one: */}
              {/* <div className="w-full">{children}</div> */}
              <div className="w-full max-w-5xl">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
