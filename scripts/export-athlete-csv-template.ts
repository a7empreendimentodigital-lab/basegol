/**
 * Gera arquivos de apoio para montar o CSV de atletas.
 *
 * Uso:
 *   npx tsx scripts/export-athlete-csv-template.ts
 *
 * Cria:
 *   docs/samples/clubes-paulista-nomes.csv — só nomes (referência)
 *   docs/samples/atletas-modelo-paulista.csv — cabeçalho + 2 linhas de exemplo
 */
import { writeFileSync } from "fs";
import { resolve } from "path";
import { prisma } from "@/lib/prisma";

async function main() {
  const base = resolve(process.cwd(), "docs/samples");
  const clubsFile = resolve(base, "clubes-paulista-nomes.csv");
  const modeloFile = resolve(base, "atletas-modelo-paulista.csv");

  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  writeFileSync(clubsFile, ["clube", ...clubs.map((c) => c.name)].join("\n"), "utf8");

  writeFileSync(
    modeloFile,
    [
      "clube;nome;sobrenome;data_nascimento;posicao;numero;categoria",
      "Palmeiras Futebol Clube;João;Silva;15/03/2014;GOL;1;Sub-11",
      "Araçatuba Futebol Clube SAF;Pedro;Santos;20/08/2014;ZAG;4;Sub-12",
    ].join("\n"),
    "utf8"
  );

  console.log(`Referência de clubes (${clubs.length}): ${clubsFile}`);
  console.log(`Modelo com exemplos: ${modeloFile}`);
  console.log("\nMonte seu elenco (uma linha por atleta) e importe:");
  console.log("  Painel: /admin/importacao-atletas");
  console.log("  CLI:    npm run import:athletes -- seu-elenco.csv");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
