import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import type { PortalSocialLink } from "@/lib/portal-brand";
import { isExternalPortalHref } from "@/lib/portal-brand";

type Props = {
  systemName?: string;
  slogan?: string;
  socialLinks?: PortalSocialLink[];
};

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  Instagram,
  Facebook,
  YouTube: Youtube,
};

export function PortalEntryFooter({
  systemName = "BASEGOL",
  slogan = "O futuro do futebol de base.",
  socialLinks = [],
}: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 shrink-0 border-t border-white/10 bg-black/95 px-4 py-8 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-left">
        <p className="max-w-md text-sm leading-relaxed text-neutral-400">{slogan}</p>

        {socialLinks.length > 0 ? (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-4 sm:justify-center">
            <span className="text-sm text-neutral-400">Siga nossas redes</span>
            <div className="flex items-center justify-center gap-2.5">
              {socialLinks.map(({ label, href }) => {
                const Icon = SOCIAL_ICONS[label] ?? Instagram;
                const external = isExternalPortalHref(href);
                return (
                  <Link
                    key={label}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    aria-label={label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-600 text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white sm:h-9 sm:w-9"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="w-full border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-neutral-500 sm:w-auto sm:border-0 sm:pt-0 sm:text-right sm:text-sm sm:whitespace-nowrap">
          © {year} {systemName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
