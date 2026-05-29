"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(console.error);
  }, []);
  return null;
}
