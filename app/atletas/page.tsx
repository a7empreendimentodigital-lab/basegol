import { AthleteCard } from "@/components/athletes/AthleteCard";
import { listPublicAthletes } from "@/services/public.service";

export const metadata = { title: "Atletas" };

export default async function AtletasPage() {
  const athletes = await listPublicAthletes();
  return (
    <main className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        {athletes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum atleta cadastrado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {athletes.map((a) => (
              <AthleteCard key={a.slug} {...a} />
            ))}
          </div>
        )}
    </main>
  );
}
