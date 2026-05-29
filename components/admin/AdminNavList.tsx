"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_GROUPS, isAdminNavActive } from "@/lib/admin-nav";

export function AdminNavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = isAdminNavActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-selected text-white"
                        : "text-muted-foreground hover:bg-graphite-light hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "")} />
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
