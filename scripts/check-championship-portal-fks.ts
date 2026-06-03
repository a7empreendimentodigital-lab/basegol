/**
 * Verifica tabelas e FKs de championship_members / championship_sponsors.
 * Uso: npx tsx scripts/check-championship-portal-fks.ts
 */
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

const EXPECTED_FKS = [
  {
    table: "championship_members",
    name: "championship_members_userId_fkey",
    column: "userId",
    ref: "users",
  },
  {
    table: "championship_members",
    name: "championship_members_championshipId_fkey",
    column: "championshipId",
    ref: "championships",
  },
  {
    table: "championship_sponsors",
    name: "championship_sponsors_championshipId_fkey",
    column: "championshipId",
    ref: "championships",
  },
] as const;

async function tableExists(name: string) {
  const rows = await prisma.$queryRaw<{ cnt: bigint }[]>(
    Prisma.sql`
      SELECT COUNT(*) AS cnt
      FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ${name}
    `
  );
  return Number(rows[0]?.cnt ?? 0) > 0;
}

async function listFks(table: string) {
  return prisma.$queryRaw<
    { CONSTRAINT_NAME: string; COLUMN_NAME: string; REFERENCED_TABLE_NAME: string }[]
  >(
    Prisma.sql`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ${table}
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `
  );
}

async function main() {
  for (const table of ["championship_members", "championship_sponsors"] as const) {
    const exists = await tableExists(table);
    console.log(`\n${table}: ${exists ? "existe" : "NÃO existe"}`);
    if (!exists) continue;
    const fks = await listFks(table);
    for (const fk of fks) {
      console.log(`  FK ${fk.CONSTRAINT_NAME} (${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME})`);
    }
  }

  console.log("\n--- Esperado ---");
  for (const exp of EXPECTED_FKS) {
    const fks = await listFks(exp.table);
    const ok = fks.some((f) => f.CONSTRAINT_NAME === exp.name);
    console.log(`${ok ? "OK" : "FALTA"} ${exp.name}`);
  }

  const migrations = await prisma.$queryRaw<
    { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]
  >`
    SELECT migration_name, finished_at, rolled_back_at
    FROM _prisma_migrations
    WHERE migration_name LIKE '%championship%'
    ORDER BY started_at
  `.catch(() => [] as { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }[]);

  if (migrations.length) {
    console.log("\n--- _prisma_migrations ---");
    for (const m of migrations) {
      const status = m.rolled_back_at
        ? "rolled back"
        : m.finished_at
          ? "applied"
          : "failed/pending";
      console.log(`  ${m.migration_name}: ${status}`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
