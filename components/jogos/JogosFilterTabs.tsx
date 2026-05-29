import Link from "next/link";
import { CalendarClock, CalendarDays, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  isLive: boolean;
  isUpcoming: boolean;
};

const tabs = [
  {
    href: "/jogos?status=LIVE",
    label: "Ao vivo",
    icon: Radio,
    isActive: (p: Props) => p.isLive,
  },
  {
    href: "/jogos?status=upcoming",
    label: "Próximos",
    icon: CalendarClock,
    isActive: (p: Props) => p.isUpcoming,
  },
  {
    href: "/jogos",
    label: "Hoje",
    icon: CalendarDays,
    isActive: (p: Props) => !p.isLive && !p.isUpcoming,
  },
] as const;

export function JogosFilterTabs({ isLive, isUpcoming }: Props) {
  const props = { isLive, isUpcoming };

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Filtrar jogos"
    >
      {tabs.map((tab) => {
        const active = tab.isActive(props);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
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
