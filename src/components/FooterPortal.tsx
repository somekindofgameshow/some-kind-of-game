"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function FooterPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("id", "skg-footer-portal");
    el.style.position = "fixed";
    el.style.left = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.zIndex = "40";
    el.style.pointerEvents = "none"; // we’ll re-enable inside
    document.body.appendChild(el);
    elRef.current = el;
    setMounted(true);
    return () => {
      el.remove();
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  return createPortal(children, elRef.current);
}
