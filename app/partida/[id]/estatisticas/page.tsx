"use client";

import { useParams } from "next/navigation";
import { MatchOperatorPanel } from "@/components/match-operator/MatchOperatorPanel";

export default function PartidaEstatisticasPage() {
  const { id } = useParams<{ id: string }>();
  return <MatchOperatorPanel matchId={id} mode="estatisticas" />;
}
