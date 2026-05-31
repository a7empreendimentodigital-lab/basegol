"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { normalizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "basegol-splash-seen";
const MIN_VISIBLE_MS = 600;
const MAX_VISIBLE_MS = 3500;

/** Apenas celular (viewport estreita + touch). */
const MOBILE_SPLASH_QUERY = "(max-width: 767px) and (hover: none), (max-width: 767px) and (pointer: coarse)";

type Props = {
  imageUrl: string | null;
};

function isMobileSplashDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MOBILE_SPLASH_QUERY).matches;
}

export function AppSplashScreen({ imageUrl }: Props) {
  const pathname = usePathname() ?? "/";
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const splashSrc = normalizeImageSrc(imageUrl);

  useEffect(() => {
    if (!splashSrc) return;
    if (pathname.startsWith("/admin")) return;
    if (!isMobileSplashDevice()) return;
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
      if (!isMobileSplashDevice()) return;
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

    const mq = window.matchMedia(MOBILE_SPLASH_QUERY);
    const onMqChange = () => {
      if (!mq.matches) hide();
    };
    mq.addEventListener("change", onMqChange);

    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
      clearTimeout(maxTimer);
      window.removeEventListener("load", scheduleHide);
      mq.removeEventListener("change", onMqChange);
    };
  }, [splashSrc, pathname]);

  if (!visible || !splashSrc) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] overflow-hidden bg-pitch transition-opacity duration-300",
        "h-[100dvh] w-full max-h-[100dvh] max-w-[100vw]",
        fading && "opacity-0 pointer-events-none"
      )}
      role="presentation"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={splashSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
    </div>
  );
}
