import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicAthleteBySlug } from "@/services/public.service";
import { notFound } from "next/navigation";

export default async function AthletePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const athlete = await getPublicAthleteBySlug(slug);
  if (!athlete) notFound();
  const fullName = `${athlete.firstName} ${athlete.lastName}`;

  return (
    <main className="p-4 md:p-6 max-w-2xl mx-auto w-full space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-secondary flex items-center justify-center font-display text-4xl text-neon">
              {athlete.shirtNumber}
            </div>
            <div>
              <CardTitle>{fullName}</CardTitle>
              <p className="text-sm text-muted-foreground">{athlete.club.name}</p>
              <Badge className="mt-2">{athlete.position}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Idade</p>
              <p className="font-medium">—</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categoria</p>
              <p className="font-medium">{athlete.category || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Gols</p>
              <p className="font-display text-2xl text-neon">—</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium text-neon">{athlete.status}</p>
            </div>
          </CardContent>
        </Card>
    </main>
  );
}
