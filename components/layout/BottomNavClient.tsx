"use client";

import dynamic from "next/dynamic";

const BottomNav = dynamic(
  () => import("@/components/layout/BottomNav").then((m) => m.BottomNav),
  {
    ssr: false,
    loading: () => <div className="h-14 shrink-0 md:hidden" aria-hidden />,
  }
);

export function BottomNavClient() {
  return <BottomNav />;
}
