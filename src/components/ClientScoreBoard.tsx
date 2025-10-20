"use client";

import { useEffect, useState } from "react";
import ScoreBoard from "./ScoreBoard";

type Props = {
  players: string[];
  initialSessionId?: string;
};

export default function ClientScoreBoard({ players, initialSessionId }: Props) {
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);

  useEffect(() => {
    if (!initialSessionId) {
      try {
        const saved = localStorage.getItem("skg-current-session-id");
        if (saved) setSessionId(saved);
      } catch {}
    }
  }, [initialSessionId]);

  // Fallback if nothing is found (still works, just won’t persist across reloads)
  const effective = sessionId || "temp";

  return <ScoreBoard players={players} sessionId={effective} />;
}
