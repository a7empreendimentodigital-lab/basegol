import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";

type Props = {
  systemName?: string;
  slogan?: string;
};

const SOCIAL = [
  { label: "Instagram", href: "#", Icon: Instagram },
  { label: "Facebook", href: "#", Icon: Facebook },
  { label: "YouTube", href: "#", Icon: Youtube },
] as const;

export function PortalEntryFooter({
  systemName = "BASEGOL",
  slogan = "O futuro do futebol de base.",
}: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 shrink-0 border-t border-white/10 bg-black/95 px-4 py-8 sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="max-w-md text-sm leading-relaxed text-neutral-400">{slogan}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 sm:justify-center">
          <span className="text-sm text-neutral-400">Siga nossas redes</span>
          <div className="flex items-center gap-2.5">
            {SOCIAL.map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-600 text-neutral-300 transition-colors hover:border-neutral-400 hover:text-white sm:h-9 sm:w-9"
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <p className="border-t border-white/10 pt-6 text-center text-xs leading-relaxed text-neutral-500 sm:border-0 sm:pt-0 sm:text-right sm:text-sm sm:whitespace-nowrap">
          © {year} {systemName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
