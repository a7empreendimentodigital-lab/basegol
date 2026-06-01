import type { AthleteStatus, PlayerPosition } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findExistingClub } from "@/lib/club-lookup";
import { normalizeAthleteCategory } from "@/lib/athlete-category";
import { slugify } from "@/lib/utils";
import { parseCsvBuffer, parseCsvText, pickColumn, type CsvRow } from "@/services/import/csv-parse";
import { findExistingAthlete } from "@/services/athlete-import/find-existing-athlete";
import { mapCsvPosition } from "@/services/athlete-import/position-map";
import { parseFlexibleDate } from "@/services/athlete-import/parse-date";

export type AthleteImportRowPreview = {
  line: number;
  clubName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  category: string;
  position: string;
  shirtNumber: number | null;
  action: "create" | "update" | "skip" | "error";
  message?: string;
};

export type AthleteImportSummary = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
};

export type AthleteImportResult = {
  preview: AthleteImportRowPreview[];
  summary: AthleteImportSummary;
};

export type AthleteImportInput = {
  buffer?: Buffer;
  text?: string;
  dryRun?: boolean;
};

function splitFullName(full: string): { firstName: string; lastName: string } | null {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function parseRow(row: CsvRow, line: number): {
  clubName: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  category: string;
  position: PlayerPosition;
  shirtNumber: number | null;
  error?: string;
} {
  const clubName =
    pickColumn(
      row,
      "clube",
      "club",
      "club_name",
      "clubname",
      "time",
      "alias",
      "apelido",
      "nome_clube",
      "official_name"
    ) || "";
  const fullName = pickColumn(row, "nome_completo", "nomecompleto", "atleta", "name");
  let firstName = pickColumn(row, "nome", "first_name", "firstname");
  let lastName = pickColumn(row, "sobrenome", "last_name", "lastname");
  if (fullName && (!firstName || !lastName)) {
    const split = splitFullName(fullName);
    if (split) {
      firstName = firstName || split.firstName;
      lastName = lastName || split.lastName;
    }
  }
  const birthRaw = pickColumn(row, "data_nascimento", "birth_date", "birthdate", "nascimento");
  const birthDate = parseFlexibleDate(birthRaw);
  const category = normalizeAthleteCategory(
    pickColumn(row, "categoria", "category", "cat") || "Sub-11"
  );
  const position = mapCsvPosition(pickColumn(row, "posicao", "position", "pos"));
  const shirtRaw = pickColumn(row, "numero", "shirt_number", "shirtnumber", "camisa");
  const shirtNumber = shirtRaw ? Number(shirtRaw.replace(/\D/g, "")) : null;

  if (!clubName) return { clubName, firstName, lastName, birthDate, category, position, shirtNumber, error: "Clube ausente" };
  if (!firstName || !lastName) {
    return { clubName, firstName, lastName, birthDate, category, position, shirtNumber, error: "Nome incompleto" };
  }
  if (!birthDate) {
    return { clubName, firstName, lastName, birthDate, category, position, shirtNumber, error: "Data de nascimento inválida" };
  }

  return { clubName, firstName, lastName, birthDate, category, position, shirtNumber };
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = `atleta-${Date.now()}`;
  let candidate = slug;
  let n = 0;
  while (true) {
    const existing = await prisma.athlete.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n += 1;
    candidate = `${slug}-${n}`;
  }
}

export async function previewAthletesCsvImport(input: AthleteImportInput): Promise<AthleteImportResult> {
  return runAthletesCsvImport({ ...input, dryRun: true });
}

export async function runAthletesCsvImport(input: AthleteImportInput): Promise<AthleteImportResult> {
  const rows = input.buffer
    ? parseCsvBuffer(input.buffer)
    : parseCsvText(input.text ?? "");
  const dryRun = input.dryRun === true;

  const preview: AthleteImportRowPreview[] = [];
  const summary: AthleteImportSummary = {
    total: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const line = i + 2;
    const parsed = parseRow(rows[i], line);
    const basePreview: AthleteImportRowPreview = {
      line,
      clubName: parsed.clubName,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      birthDate: parsed.birthDate ? parsed.birthDate.toISOString().slice(0, 10) : "",
      category: parsed.category,
      position: parsed.position,
      shirtNumber: parsed.shirtNumber,
      action: "error",
    };

    if (parsed.error) {
      preview.push({ ...basePreview, action: "error", message: parsed.error });
      summary.errors += 1;
      continue;
    }

    const club = await findExistingClub(parsed.clubName);
    if (!club) {
      preview.push({
        ...basePreview,
        action: "error",
        message: `Clube não encontrado: ${parsed.clubName}`,
      });
      summary.errors += 1;
      continue;
    }

    const existing = await findExistingAthlete({
      clubId: club.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      birthDate: parsed.birthDate!,
      shirtNumber: parsed.shirtNumber,
    });

    if (existing) {
      if (!dryRun) {
        await prisma.athlete.update({
          where: { id: existing.id },
          data: {
            position: parsed.position,
            shirtNumber: parsed.shirtNumber ?? existing.shirtNumber,
            category: parsed.category,
            status: "ACTIVE" satisfies AthleteStatus,
          },
        });
      }
      preview.push({ ...basePreview, clubName: club.name, action: "update" });
      summary.updated += 1;
      continue;
    }

    if (!dryRun) {
      const slug = await ensureUniqueSlug(
        `${parsed.firstName}-${parsed.lastName}-${parsed.birthDate!.getFullYear()}`
      );
      await prisma.athlete.create({
        data: {
          clubId: club.id,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          slug,
          birthDate: parsed.birthDate!,
          position: parsed.position,
          shirtNumber: parsed.shirtNumber,
          category: parsed.category,
          status: "ACTIVE",
        },
      });
    }

    preview.push({ ...basePreview, clubName: club.name, action: "create" });
    summary.created += 1;
  }

  return { preview: preview.slice(0, 500), summary };
}
