import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { MobileBrandLogo } from "@/components/brand/MobileBrandLogo";

type Props = {
  mobileLogoUrl?: string | null;
  systemName?: string;
  slogan?: string;
};

const SOCIAL = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "YouTube", href: "#", Icon: Youtube },
] as const;

export function PortalEntryFooter({
  mobileLogoUrl = null,
  systemName = "BASEGOL",
  slogan = "O futuro do futebol de base.",
}: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 shrink-0 border-t border-white/10 bg-black/95 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
          <MobileBrandLogo
            href="/"
            src={mobileLogoUrl}
            systemName={systemName}
            imageClassName="h-9 sm:h-10"
          />
          <p className="text-sm text-neutral-400">{slogan}</p>
        </div>

        <div className="flex items-center gap-4 sm:justify-center">
          <span className="text-sm text-neutral-400 whitespace-nowrap">Siga nossas redes</span>
          <div className="flex items-center gap-2.5">
            {SOCIAL.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-600 text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm text-neutral-500 sm:text-right whitespace-nowrap">
          © {year} {systemName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
