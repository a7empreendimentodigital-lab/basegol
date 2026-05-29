"use client";

import { useParams } from "next/navigation";
import { MatchLineupPanel } from "@/components/match-operator/MatchLineupPanel";

export default function PartidaEscalacaoPage() {
  const { id } = useParams<{ id: string }>();
  return <MatchLineupPanel matchId={id} />;
}
