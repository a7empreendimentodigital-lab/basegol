import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-url";
import { ArrowLeft, Calendar } from "lucide-react";

type Props = {
  name: string;
  season: string;
  logoUrl?: string | null;
  description?: string | null;
};

export function ChampionshipDetailHeader({ name, season, logoUrl, description }: Props) {
  const logoSrc = normalizeImageSrc(logoUrl);

  return (
    <header className="space-y-4">
      <Link
        href="/campeonatos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        Voltar aos campeonatos
      </Link>

      <div className="flex items-start gap-4 sm:gap-5 border-b border-line/60 pb-4 sm:pb-5">
        <div className="flex h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 items-center justify-center">
          {logoSrc ? (
            <SafeImage
              src={logoSrc}
              alt=""
              width={72}
              height={72}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="font-display text-2xl text-muted-foreground/80" aria-hidden>
              {name.slice(0, 2).toUpperCase()}
            </span>
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
            <p className="mt-2 text-sm text-muted-foreground/90 line-clamp-3">{description}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
