"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { PORTAL_INSTITUTIONAL_NAV } from "@/lib/portal-routes";
import { cn } from "@/lib/utils";

type Props = {
  activePath: string;
  searchPlaceholder?: string;
  onSearch?: (q: string) => void;
};

export function PortalEntryHeader({
  activePath,
  searchPlaceholder = "Buscar campeonato...",
  onSearch,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <header className="relative z-20 border-b border-line/40 bg-pitch/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Logo href="/" size="md" showWordmark className="shrink-0" />

        <nav
          className="flex items-center justify-center gap-6 sm:flex-1"
          aria-label="Institucional"
        >
          {PORTAL_INSTITUTIONAL_NAV.map((item) => {
            const active = activePath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  active
                    ? "text-primary border-b-2 border-primary pb-0.5"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <form
          className="w-full sm:max-w-xs shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (onSearch) {
              onSearch(q);
              return;
            }
            if (q) router.push(`/?q=${encodeURIComponent(q)}`);
          }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-full border border-line/80 bg-graphite/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
