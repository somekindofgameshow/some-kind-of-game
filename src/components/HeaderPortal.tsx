"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function HeaderPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("header-scoreboard-slot"));
  }, []);

  if (!target) return null;
  return createPortal(children, target);
}
