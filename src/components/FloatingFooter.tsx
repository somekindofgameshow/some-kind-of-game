"use client";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Floating footer with:
 * - full-width fixed bar
 * - collapsible content
 * - auto-hide on small screens (default collapsed if < md)
 * - a "peek" chip when collapsed so users can reopen
 */
export default function FloatingFooter({
  children,
  sessionKey = "default",
  breakpointPx = 768, // Tailwind md breakpoint
  peekLabel = "Scoreboard",
}: {
  children: React.ReactNode;
  sessionKey?: string;
  breakpointPx?: number;
  peekLabel?: string;
}) {
  const storageKey = `skg-footer-collapsed-${sessionKey}`;
  const userSetKey = `skg-footer-userpref-${sessionKey}`;
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const userPrefSet = useRef(false);

  // initial state: use saved pref if present; otherwise collapse on small screens
  useEffect(() => {
    let pref: string | null = null;
    try {
      pref = localStorage.getItem(storageKey);
      const userPref = localStorage.getItem(userSetKey);
      userPrefSet.current = userPref === "1";
    } catch {}
    if (pref !== null) {
      setCollapsed(pref === "1");
    } else if (typeof window !== "undefined") {
      setCollapsed(window.innerWidth < breakpointPx);
    }
  }, [breakpointPx, storageKey]);

  // persist whenever collapsed changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, collapsed ? "1" : "0");
    } catch {}
  }, [collapsed, storageKey]);

  // responsive auto-toggle (only if user hasn't explicitly chosen yet)
  useEffect(() => {
    function onResize() {
      if (userPrefSet.current) return;
      const shouldCollapse = window.innerWidth < breakpointPx;
      setCollapsed(shouldCollapse);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpointPx]);

  function toggleCollapsed(next?: boolean) {
    const v = typeof next === "boolean" ? next : !collapsed;
    userPrefSet.current = true;
    try { localStorage.setItem(userSetKey, "1"); } catch {}
    setCollapsed(v);
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

  return (
    <div className="pointer-events-auto relative">
      {/* Full-width bar at the bottom */}
      <div className="w-full px-3 pb-3">
        <div className={panelClasses}>
          {/* Header row */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs opacity-80">Scoreboard</div>
            <button
              className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
              onClick={() => toggleCollapsed(true)}
              aria-label="Hide scoreboard"
            >
              Hide
            </button>
          </div>

          {/* Content area: CENTER your scoreboard, allow full width */}
          <div className="px-3 pb-3">
            <div className="w-full flex justify-center">
              {/* If you ever want the child to stretch, wrap it in w-full here */}
              <div className="w-full max-w-5xl">{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Peek mini-chip (only shown when collapsed) */}
      {collapsed && (
        <div className="absolute left-1/2 -translate-x-1/2 -translate-y-2 bottom-0">
          <button
            className="skg-btn px-3 py-1 rounded-full text-sm shadow-lg"
            onClick={() => toggleCollapsed(false)}
            aria-label="Show scoreboard"
          >
            {peekLabel}
          </button>
        </div>
      )}
    </div>
  );
}
