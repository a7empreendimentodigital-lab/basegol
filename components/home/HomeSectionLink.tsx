import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HomeSectionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
      <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
    </Link>
  );
}
