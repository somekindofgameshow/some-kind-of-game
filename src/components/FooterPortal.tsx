"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function FooterPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "skg-footer-portal");
    document.body.appendChild(el);
    elRef.current = el;
    setMounted(true);
    return () => { el.remove(); };
  }, []);

  if (!mounted || !elRef.current) return null;
  return createPortal(
    // Fixed to the viewport bottom, high z-index, pass pointer events to children only
    <div className="fixed inset-x-0 bottom-0 z-[100] pointer-events-none">
      {children}
    </div>,
    elRef.current
  );
}
