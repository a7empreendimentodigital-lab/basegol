import { NextResponse } from "next/server";
import { getLatestStandings, getTopScorers } from "@/services/statistics.service";

export async function GET() {
  const [topScorers, standings] = await Promise.all([getTopScorers(10), getLatestStandings()]);
  return NextResponse.json({
    topScorers,
    standings,
  });
}
