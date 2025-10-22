// src/components/ClientScoreBoard.tsx
"use client";

import ScoreBoard from "@/components/ScoreBoard";

type Props = {
  players: string[];
  /** Optional – unique ID for this session's saved scores */
  sessionId?: string;
  /** Use "compact" for the header version */
  variant?: "default" | "compact";
};

export default function ClientScoreBoard({
  players,
  sessionId = "default",
  variant = "default",
}: Props) {
  // ScoreBoard expects sessionKey (not sessionId), so we forward it.
  return (
    <ScoreBoard
      players={players}
      sessionKey={sessionId}
      variant={variant}
    />
  );
}
