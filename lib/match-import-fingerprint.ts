import { normalizeClubName } from "@/lib/normalize-name";

export type MatchFingerprintInput = {
  championshipId: string;
  categorySlug: string;
  phaseSlug: string;
  turnSlug: string;
  roundNumber: number;
  scheduledAt: Date;
  homeClubId: string;
  awayClubId: string;
};

function fingerprintParts(input: MatchFingerprintInput, includeCategory: boolean): string[] {
  const ts = input.scheduledAt.toISOString();
  const [home, away] = [input.homeClubId, input.awayClubId].sort();
  const parts = [input.championshipId];
  if (includeCategory) parts.push(input.categorySlug);
  parts.push(
    input.phaseSlug,
    input.turnSlug,
    String(input.roundNumber),
    ts,
    home,
    away
  );
  return parts;
}

/** Fingerprint atual (inclui categoria). */
export function buildMatchImportFingerprint(input: MatchFingerprintInput): string {
  return fingerprintParts(input, true).join("|");
}

/** Importações antigas sem slug de categoria no fingerprint. */
export function buildLegacyMatchImportFingerprint(
  input: Omit<MatchFingerprintInput, "categorySlug">
): string {
  return fingerprintParts({ ...input, categorySlug: "" }, false).join("|");
}

const TABLE_GENERIC = new Set([
  "futebol",
  "clube",
  "esporte",
  "ltda",
  "saf",
  "s",
  "a",
  "de",
  "do",
  "da",
  "das",
  "dos",
]);

export function buildClubAliasKeys(fullName: string): string[] {
  const base = normalizeClubName(fullName);
  const tokens = base.split(" ").filter(Boolean);
  const keys = new Set<string>([base]);
  const distinctive = tokens.filter((t) => t.length > 2 && !TABLE_GENERIC.has(t));

  if (tokens.length >= 2) {
    keys.add(tokens.slice(0, 2).join(" "));
    keys.add(tokens.slice(0, 3).join(" "));
  }

  if (distinctive.length >= 1) {
    const lead = distinctive.slice(0, 2).join(" ");
    keys.add(lead);
    keys.add(`${lead} fc`);
    keys.add(`${lead} ec`);
    keys.add(`${distinctive[0]} fc`);
    keys.add(`${distinctive[0]} ec`);
    if (distinctive[0].length >= 4) keys.add(distinctive[0]);
  }

  if (base.includes("palmeiras")) keys.add("palmeiras fc");
  if (base.includes("porto") && base.includes("foot")) keys.add("porto foot ball ltda");
  if (base.includes("sao paulo") && base.includes("futebol")) keys.add("sao paulo fc");
  if (base.includes("santos")) keys.add("santos fc");
  if (base.includes("corinthians")) keys.add("sc corinthians pta");

  return [...keys];
}
