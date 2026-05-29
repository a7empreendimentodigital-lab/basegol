import type { MatchSumulaData } from "@/services/sumula.service";

type Props = {
  data: MatchSumulaData;
};

function Cell({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border border-black px-1 py-0.5 text-[9px] align-top ${className}`}
    >
      {children}
    </td>
  );
}

function Th({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return (
    <th
      colSpan={colSpan}
      className="border border-black bg-[#f0f0f0] px-1 py-1 text-[9px] font-bold text-left"
    >
      {children}
    </th>
  );
}

function PlayerTable({
  title,
  players,
}: {
  title: string;
  players: MatchSumulaData["homePlayers"];
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-bold mb-1">{title}</p>
      <table className="w-full border-collapse text-black">
        <thead>
          <tr>
            <Th>Nº</Th>
            <Th>Nome Completo do Jogador</Th>
            <Th>T/R</Th>
            <Th>P/A</Th>
            <Th>Registro</Th>
          </tr>
        </thead>
        <tbody>
          {players.length === 0 ? (
            <tr>
              <Cell colSpan={5}>Nenhum jogador relacionado</Cell>
            </tr>
          ) : (
            players.map((p, i) => (
              <tr key={`${p.name}-${i}`}>
                <Cell>{p.number ?? "—"}</Cell>
                <Cell>{p.name}</Cell>
                <Cell>{p.role}</Cell>
                <Cell>{p.proAmateur}</Cell>
                <Cell>{p.registration}</Cell>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function PageFooter({ page, total, publishedAt }: { page: number; total: number; publishedAt: string }) {
  return (
    <p className="mt-4 text-[8px] text-center text-black border-t border-black pt-2">
      Federação Paulista de Futebol · Publicação da Súmula: {publishedAt} · Página {page} de {total}
    </p>
  );
}

export function MatchSumulaDocument({ data }: Props) {
  const arb = data.arbitration;

  return (
    <div className="sumula-document bg-white text-black text-[10px] leading-snug font-sans">
      {/* Página 1 */}
      <section className="sumula-page mb-8">
        <header className="text-center border-b border-black pb-2 mb-3">
          <p className="text-[11px] font-bold">
            Comissão Estadual de Arbitragem de Futebol - CEAF · Jogo: {data.gameNumber} /{" "}
            {data.seasonYear}
          </p>
          <p className="text-[10px]">SÃO PAULO</p>
          <p className="text-[11px] font-bold mt-2">
            Campeonato: {data.championshipLabel} / {data.seasonYear} · Rodada: {data.roundLabel}
          </p>
          <p className="text-[10px]">Categoria: {data.categoryLabel}</p>
          <p className="text-[12px] font-bold mt-1">Jogo: {data.matchTitle}</p>
          <p className="text-[10px] mt-1">
            Data: {data.date} · Horário: {data.time} · Estádio: {data.venue}
          </p>
          <p className="text-[11px] font-bold mt-2">
            Placar final: {data.homeScore} X {data.awayScore}
          </p>
        </header>

        <div className="mb-4">
          <p className="font-bold mb-1">Arbitragem</p>
          <table className="w-full text-[9px]">
            <tbody>
              <tr>
                <td className="w-40 font-semibold">Árbitro:</td>
                <td>{arb.referee || "—"}</td>
              </tr>
              <tr>
                <td className="font-semibold">Árbitro Assistente 1:</td>
                <td>{arb.assistant1 || "—"}</td>
              </tr>
              <tr>
                <td className="font-semibold">Árbitro Assistente 2:</td>
                <td>{arb.assistant2 || "—"}</td>
              </tr>
              <tr>
                <td className="font-semibold">Quarto Árbitro:</td>
                <td>{arb.fourthOfficial || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.chronologyLines.length > 0 ? (
          <div className="mb-4">
            <p className="font-bold mb-1">Cronologia</p>
            <ul className="list-disc pl-4 text-[9px] space-y-0.5">
              {data.chronologyLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mb-2">
          <p className="font-bold mb-2">Relação de Jogadores</p>
          <div className="flex gap-3">
            <PlayerTable title={data.homeName} players={data.homePlayers} />
            <PlayerTable title={data.awayName} players={data.awayPlayers} />
          </div>
          <p className="text-[8px] mt-1">T = Titular | R = Reserva | P = Profissional | A = Amador</p>
        </div>

        <PageFooter page={1} total={4} publishedAt={data.publishedAt} />
      </section>

      {/* Página 2 */}
      <section className="sumula-page mb-8 break-before-page">
        <p className="font-bold mb-2">Comissão Técnica</p>
        <div className="flex gap-6 mb-6">
          <div className="flex-1">
            <p className="font-semibold text-[10px] mb-1">{data.homeName}</p>
            {data.homeStaff.length === 0 ? (
              <p className="text-[9px]">—</p>
            ) : (
              data.homeStaff.map((s) => (
                <p key={s.role} className="text-[9px]">
                  <span className="font-semibold">{s.role}:</span> {s.name}
                </p>
              ))
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[10px] mb-1">{data.awayName}</p>
            {data.awayStaff.length === 0 ? (
              <p className="text-[9px]">—</p>
            ) : (
              data.awayStaff.map((s) => (
                <p key={s.role} className="text-[9px]">
                  <span className="font-semibold">{s.role}:</span> {s.name}
                </p>
              ))
            )}
          </div>
        </div>

        <p className="font-bold mb-1">Substituições</p>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr>
              <Th>Equipe</Th>
              <Th>Nº Saiu</Th>
              <Th>Saiu</Th>
              <Th>Nº Entrou</Th>
              <Th>Entrou</Th>
              <Th>Tempo</Th>
              <Th>Sigla</Th>
            </tr>
          </thead>
          <tbody>
            {data.hasSubstitutions ? (
              data.substitutions.map((s, i) => (
                <tr key={i}>
                  <Cell>{s.teamName}</Cell>
                  <Cell>{s.outNumber}</Cell>
                  <Cell>{s.outName}</Cell>
                  <Cell>{s.inNumber}</Cell>
                  <Cell>{s.inName}</Cell>
                  <Cell>{s.time}</Cell>
                  <Cell>{s.period}</Cell>
                </tr>
              ))
            ) : (
              <tr>
                <Cell colSpan={7}>NÃO HOUVE SUBSTITUIÇÕES</Cell>
              </tr>
            )}
          </tbody>
        </table>

        <p className="font-bold mb-1">Substituições por concussão</p>
        <p className="text-[9px] mb-4">NÃO HOUVE SUBSTITUIÇÕES</p>

        <p className="font-bold mb-1">Disciplinares</p>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Equipe</Th>
              <Th>Nº</Th>
              <Th>Nome do Jogador</Th>
              <Th>Tempo</Th>
              <Th>Sigla</Th>
            </tr>
          </thead>
          <tbody>
            {[...data.cautions, ...data.expulsions].length === 0 ? (
              <tr>
                <Cell colSpan={5}>NÃO HOUVE OCORRÊNCIAS DISCIPLINARES</Cell>
              </tr>
            ) : (
              [...data.cautions, ...data.expulsions].map((d, i) => (
                <tr key={i}>
                  <Cell>{d.teamName}</Cell>
                  <Cell>{d.number}</Cell>
                  <Cell>{d.playerName}</Cell>
                  <Cell>{d.time}</Cell>
                  <Cell>{d.period}</Cell>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {[...data.cautions, ...data.expulsions].map((d, i) => (
          <p key={`reason-${i}`} className="text-[8px] mt-1 mb-2">
            <span className="font-semibold">{d.teamName}:</span> {d.reason}
          </p>
        ))}

        <PageFooter page={2} total={4} publishedAt={data.publishedAt} />
      </section>

      {/* Página 3 */}
      <section className="sumula-page mb-8 break-before-page">
        <p className="font-bold mb-2">Advertências</p>
        <p className="text-[9px] mb-6">
          {data.hasCautions ? "Ver seção Disciplinares (cartões amarelos)." : "NÃO HOUVE ADVERTÊNCIAS"}
        </p>

        <p className="font-bold mb-2">Expulsões</p>
        <p className="text-[9px] mb-6">
          {data.hasExpulsions ? "Ver seção Disciplinares (cartões vermelhos)." : "NÃO HOUVE EXPULSÕES"}
        </p>

        <PageFooter page={3} total={4} publishedAt={data.publishedAt} />
      </section>

      {/* Página 4 */}
      <section className="sumula-page break-before-page">
        <p className="font-bold mb-2">Gols</p>
        <table className="w-full border-collapse mb-2">
          <thead>
            <tr>
              <Th>Equipe</Th>
              <Th>Nº</Th>
              <Th>Nome do Jogador</Th>
              <Th>Tipo</Th>
              <Th>Tempo</Th>
              <Th>Sigla</Th>
            </tr>
          </thead>
          <tbody>
            {data.goals.length === 0 ? (
              <tr>
                <Cell colSpan={6}>NÃO HOUVE GOLS</Cell>
              </tr>
            ) : (
              data.goals.map((g, i) => (
                <tr key={i}>
                  <Cell>{g.teamName}</Cell>
                  <Cell>{g.number}</Cell>
                  <Cell>{g.playerName}</Cell>
                  <Cell>{g.type}</Cell>
                  <Cell>{g.time}</Cell>
                  <Cell>{g.period}</Cell>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="text-[8px] mb-4">NR = Normal | PN = Pênalti | CT = Contra | FT = Falta</p>

        <p className="font-bold mb-1">Motivo de atraso no início e/ou reinício, e de acréscimos</p>
        <p className="text-[9px] mb-4">{data.arbitration.addedTimeReason || "Não houve acréscimo."}</p>

        <p className="font-bold mb-1">Ocorrências / Observações</p>
        {data.arbitration.ambulanceDoctor ? (
          <p className="text-[9px]">Médico da ambulância: {data.arbitration.ambulanceDoctor}</p>
        ) : null}
        <p className="text-[9px]">
          Bolas novas e do modelo definido para a competição?{" "}
          {data.arbitration.newBallsProvided === false ? "NÃO" : "SIM"}
        </p>
        <p className="text-[9px] mt-2 whitespace-pre-wrap">{data.observations}</p>

        <p className="font-bold mt-4 mb-1">Relatório do Assistente</p>
        <p className="text-[9px]">{data.arbitration.assistantReport || "NADA A RELATAR"}</p>

        <p className="font-bold mt-4 mb-1">Observações Eventuais</p>
        <p className="text-[9px]">{data.arbitration.eventualObservations || "NADA HOUVE DE ANORMAL."}</p>

        <PageFooter page={4} total={4} publishedAt={data.publishedAt} />
      </section>
    </div>
  );
}
