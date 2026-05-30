"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "basegol-splash-seen";
const MIN_VISIBLE_MS = 600;
const MAX_VISIBLE_MS = 3500;

type Props = {
  imageUrl: string | null;
};

export function AppSplashScreen({ imageUrl }: Props) {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const splashSrc = normalizeImageSrc(imageUrl);

  useEffect(() => {
    if (!splashSrc) return;
    if (pathname.startsWith("/admin")) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let cancelled = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    const hide = () => {
      if (cancelled) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setFading(true);
      hideTimer = setTimeout(() => setVisible(false), 280);
    };

    const scheduleHide = () => {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
      hideTimer = setTimeout(hide, wait);
    };

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) return;
      setVisible(true);
      if (document.readyState === "complete") {
        scheduleHide();
      } else {
        window.addEventListener("load", scheduleHide, { once: true });
      }
    };
    img.onerror = () => {
      if (cancelled) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
    };
    img.src = splashSrc;

    const maxTimer = setTimeout(hide, MAX_VISIBLE_MS);

    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
      clearTimeout(maxTimer);
      window.removeEventListener("load", scheduleHide);
    };
  }, [splashSrc, pathname]);

  if (!visible || !splashSrc) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center bg-background transition-opacity duration-300",
        fading && "opacity-0 pointer-events-none"
      )}
      role="presentation"
      aria-hidden
    >
      <div className="relative flex h-full w-full max-h-[min(100%,720px)] max-w-lg items-center justify-center p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={splashSrc} alt="" className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}
