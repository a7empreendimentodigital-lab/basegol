import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  DEVELOPER_NAME,
  DEVELOPER_URL,
  resolveDeveloperLogoUrl,
} from "@/lib/site-developer";
import { getBrandConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type SiteFooterInnerProps = {
  systemName: string;
  developerLogoUrl?: string | null;
  className?: string;
};

export function SiteFooterInner({
  systemName,
  developerLogoUrl,
  className,
}: SiteFooterInnerProps) {
  const year = new Date().getFullYear();
  const logoSrc = developerLogoUrl ?? resolveDeveloperLogoUrl();

  return (
    <footer
      className={cn(
        "mt-auto border-t border-line/80 bg-graphite/40 px-4 py-6 sm:px-6 sm:py-8",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:gap-5">
        <p className="text-xs text-muted-foreground leading-relaxed">
          © {year} {systemName}. Todos os direitos reservados.
        </p>

        <div className="flex flex-col items-center gap-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
            Desenvolvido por
          </p>
          <Link
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "group inline-flex items-center gap-2.5 rounded-xl border border-line/60 bg-pitch/30 px-3 py-2",
              "transition-colors hover:border-line hover:bg-graphite-light"
            )}
            aria-label={`${DEVELOPER_NAME} — site do desenvolvedor (abre em nova aba)`}
          >
            {logoSrc ? (
              <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-md bg-background/10">
                <SafeImage
                  src={logoSrc}
                  alt=""
                  fill
                  className="object-contain p-0.5"
                  sizes="32px"
                />
              </span>
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neon/15 font-display text-sm text-neon"
                aria-hidden
              >
                A7
              </span>
            )}
            <span className="text-sm font-medium text-foreground group-hover:text-neon transition-colors">
              {DEVELOPER_NAME}
            </span>
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-neon transition-colors"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}

export async function SiteFooter({ className }: { className?: string }) {
  const brand = await getBrandConfig();
  return (
    <SiteFooterInner
      systemName={brand?.systemName?.trim() || "BASEGOL"}
      developerLogoUrl={resolveDeveloperLogoUrl()}
      className={className}
    />
  );
}
