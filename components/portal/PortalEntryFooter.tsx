import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { DEVELOPER_NAME, DEVELOPER_URL } from "@/lib/site-developer";

export function PortalEntryFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-line/40 bg-pitch/90 px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo href="/" size="sm" showWordmark />
          <p className="text-xs text-muted-foreground">O futuro do futebol de base.</p>
        </div>

        <div className="text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Siga nossas redes
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Instagram · Facebook · YouTube
          </p>
        </div>

        <div className="text-center sm:text-right text-xs text-muted-foreground space-y-1">
          <p>© {year} BaseGol. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <Link
              href={DEVELOPER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {DEVELOPER_NAME}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
