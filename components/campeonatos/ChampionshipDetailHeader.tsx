import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";

type Props = {
  name: string;
  season: string;
  logoUrl?: string | null;
  description?: string | null;
};

export function ChampionshipDetailHeader({ name, season, logoUrl, description }: Props) {
  return (
    <header className="space-y-4">
      <Link
        href="/campeonatos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar aos campeonatos
      </Link>

      <div className="flex items-start gap-4 sm:gap-5 rounded-2xl border border-line bg-graphite-light p-5 sm:p-6">
        <div className="flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center">
          {logoUrl ? (
            <SafeImage
              src={logoUrl}
              alt=""
              width={72}
              height={72}
              className="h-full w-full object-contain"
            />
          ) : (
            <Trophy
              className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground/90"
              strokeWidth={1.25}
              aria-hidden
            />
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl tracking-wide text-foreground leading-tight">
            {name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span>Temporada {season}</span>
          </p>
          {description ? (
            <p className="mt-3 text-sm text-muted-foreground/90 leading-relaxed">{description}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
