"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-line bg-secondary/80 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-line/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
