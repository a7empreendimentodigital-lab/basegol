/** CTR derivado de impressões e cliques (preparado para relatórios futuros). */
export function sponsorCtr(impressions: number, clicks: number): number {
  if (impressions <= 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100;
}
