import { notFound } from "next/navigation";
import { MatchSumulaDocument } from "@/components/sumula/MatchSumulaDocument";
import { SumulaPageActions } from "@/components/sumula/SumulaPageActions";
import { getMatchSumula } from "@/services/sumula.service";

export default async function PartidaSumulaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sumula = await getMatchSumula(id);
  if (!sumula) notFound();

  return (
    <div>
      <SumulaPageActions matchId={id} initialMeta={sumula.arbitration} />
      <div className="sumula-print-area rounded-lg overflow-hidden shadow-lg border border-border">
        <MatchSumulaDocument data={sumula} />
      </div>
    </div>
  );
}
