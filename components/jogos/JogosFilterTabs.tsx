import Link from "next/link";
import { CalendarClock, CalendarDays, Radio } from "lucide-react";
import { buildJogosHref } from "@/lib/jogos-category-filter";
import { cn } from "@/lib/utils";

type Props = {
  isLive: boolean;
  isUpcoming: boolean;
  activeCategory?: string | null;
};

const tabs = [
  {
    path: "/jogos?status=LIVE" as const,
    label: "Ao vivo",
    icon: Radio,
    isActive: (p: Props) => p.isLive,
  },
  {
    path: "/jogos?status=upcoming" as const,
    label: "Próximos",
    icon: CalendarClock,
    isActive: (p: Props) => p.isUpcoming,
  },
  {
    path: "/jogos" as const,
    label: "Hoje",
    icon: CalendarDays,
    isActive: (p: Props) => !p.isLive && !p.isUpcoming,
  },
] as const;

export function JogosFilterTabs({ isLive, isUpcoming, activeCategory = null }: Props) {
  const props = { isLive, isUpcoming, activeCategory };

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Filtrar jogos"
    >
      {tabs.map((tab) => {
        const active = tab.isActive(props);
        const Icon = tab.icon;
        const href = buildJogosHref(tab.path, activeCategory);
        return (
          <Link
            key={tab.path}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-foreground bg-foreground text-background"
                : "border-line bg-graphite-light/80 text-muted-foreground hover:bg-graphite/60 hover:text-foreground"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
