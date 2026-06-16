"use client";

import { Suspense } from "react";
import { NavigationProgress } from "@/components/layout/NavigationProgress";

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );
}
