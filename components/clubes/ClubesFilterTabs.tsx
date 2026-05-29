"use client";

import Link from "next/link";
import { Layers, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "clubes" | "grupos";

type Props = {
  active: Tab;
};

const tabs: { id: Tab; href: string; label: string; icon: typeof Shield }[] = [
  { id: "clubes", href: "/clubes", label: "Clubes", icon: Shield },
  { id: "grupos", href: "/clubes?tab=grupos", label: "Grupos", icon: Layers },
];

export function ClubesFilterTabs({ active }: Props) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Seção de clubes">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-line bg-pitch/50 text-muted-foreground hover:bg-graphite/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
