import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parseCsvBuffer, pickColumn } from "@/services/import/csv-parse";
import type {
  PaulistaCompetition,
  PaulistaFixture,
  PaulistaGroupTeam,
  PaulistaPack,
} from "@/services/paulista-pack-import/paulista-pack.types";

function parseGroupTeamsCsv(buffer: Buffer): PaulistaGroupTeam[] {
  return parseCsvBuffer(buffer).map((row) => ({
    competition_category: pickColumn(row, "competition_category", "category"),
    group: Number(pickColumn(row, "group")),
    official_name: pickColumn(row, "official_name"),
    alias: pickColumn(row, "alias"),
  }));
}

function parseFixturesCsv(buffer: Buffer): PaulistaFixture[] {
  return parseCsvBuffer(buffer).map((row) => ({
    competition_id: pickColumn(row, "competition_id"),
    category: pickColumn(row, "category"),
    round: Number(pickColumn(row, "round")),
    match_number: Number(pickColumn(row, "match_number", "matchnumber")),
    date: pickColumn(row, "date"),
    weekday: pickColumn(row, "weekday") || undefined,
    time: pickColumn(row, "time"),
    home_alias: pickColumn(row, "home_alias"),
    home_official: pickColumn(row, "home_official"),
    away_alias: pickColumn(row, "away_alias"),
    away_official: pickColumn(row, "away_official"),
    venue: pickColumn(row, "venue"),
    status: pickColumn(row, "status") || "scheduled",
    raw_line: pickColumn(row, "raw_line") || undefined,
  }));
}

function parseCompetitionsCsv(buffer: Buffer): PaulistaCompetition[] {
  return parseCsvBuffer(buffer).map((row) => ({
    competition_id: pickColumn(row, "competition_id"),
    name: pickColumn(row, "name"),
    season: Number(pickColumn(row, "season")),
    category: pickColumn(row, "category"),
    source: pickColumn(row, "source") || undefined,
  }));
}

/** Carrega pacote FPF a partir de pasta com CSVs ou JSON único. */
export function loadPaulistaPackFromDir(dir: string): PaulistaPack {
  const groupPath = join(dir, "group_teams.csv");
  const fixturesPath = join(dir, "fixtures.csv");
  if (!existsSync(groupPath) || !existsSync(fixturesPath)) {
    throw new Error("Pasta deve conter group_teams.csv e fixtures.csv");
  }

  const groupTeams = parseGroupTeamsCsv(readFileSync(groupPath));
  const fixtures = parseFixturesCsv(readFileSync(fixturesPath));

  let competitions: PaulistaCompetition[] = [];
  const compPath = join(dir, "competitions.csv");
  if (existsSync(compPath)) {
    competitions = parseCompetitionsCsv(readFileSync(compPath));
  }

  const season = competitions[0]?.season ?? 2026;
  return { season, competitions, groupTeams, fixtures };
}

export function loadPaulistaPackFromJsonFile(filePath: string): PaulistaPack {
  const raw = JSON.parse(readFileSync(filePath, "utf8")) as {
    competitions?: PaulistaCompetition[];
    group_teams?: PaulistaGroupTeam[];
    fixtures?: PaulistaFixture[];
  };

  const competitions = raw.competitions ?? [];
  const groupTeams = raw.group_teams ?? [];
  const fixtures = raw.fixtures ?? [];
  const season = competitions[0]?.season ?? 2026;

  return { season, competitions, groupTeams, fixtures };
}

export function loadPaulistaPack(source: string): PaulistaPack {
  if (source.endsWith(".json")) {
    return loadPaulistaPackFromJsonFile(source);
  }
  return loadPaulistaPackFromDir(source);
}
