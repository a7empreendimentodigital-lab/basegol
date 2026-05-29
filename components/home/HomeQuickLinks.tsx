import Link from "next/link";
import { CalendarClock, ListOrdered, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/jogos?status=LIVE", label: "Jogos ao vivo", icon: Radio },
  { href: "/jogos?status=upcoming", label: "Próximos jogos", icon: CalendarClock },
  { href: "/tabela", label: "Tabelas", icon: ListOrdered },
] as const;

export function HomeQuickLinks() {
  return (
    <nav className="flex flex-wrap gap-2 pt-1" aria-label="Atalhos">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-line bg-graphite-light/80 px-4 py-2 text-sm font-medium",
            "text-muted-foreground transition-colors hover:bg-graphite/80 hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
