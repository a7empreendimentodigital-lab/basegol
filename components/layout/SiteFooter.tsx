import Link from "next/link";
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
        "mt-auto border-t border-line/80 bg-graphite/40 px-4 py-5 sm:px-6 sm:py-6",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center">
        <p className="text-xs text-muted-foreground">
          © {year} {systemName}. Todos os direitos reservados.
        </p>

        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-2 sm:gap-y-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/75">
            Desenvolvido por
          </span>
          <Link
            href={DEVELOPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2 text-muted-foreground hover:text-foreground"
            aria-label={`${DEVELOPER_NAME} — site do desenvolvedor (abre em nova aba)`}
          >
            {logoSrc ? (
              <span className="relative block h-5 w-5 shrink-0 sm:h-4 sm:w-4">
                <SafeImage
                  src={logoSrc}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="20px"
                />
              </span>
            ) : null}
            <span className="text-xs font-normal text-inherit sm:text-sm">
              {DEVELOPER_NAME}
            </span>
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
