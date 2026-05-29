import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTopScorers } from "@/services/statistics.service";

export const metadata = { title: "Estatísticas" };

export default async function EstatisticasPage() {
  const topScorers = await getTopScorers(10);
  return (
    <main className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-base">Artilharia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topScorers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem artilheiros cadastrados.</p>
            ) : (
              topScorers.map((s, i) => (
                <div key={s.athleteId} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <p className="text-sm">{i + 1}. {s.name} <span className="text-muted-foreground">({s.club})</span></p>
                  <p className="font-display text-2xl text-neon">{s.goals}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
    </main>
  );
}
