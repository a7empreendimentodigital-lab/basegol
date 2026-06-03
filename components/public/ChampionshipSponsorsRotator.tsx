"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-url";
import {
  advanceSponsorRotation,
  createSponsorRotationBag,
} from "@/lib/sponsor-rotation";
import { cn } from "@/lib/utils";

const ROTATION_MS = 3000;
const FADE_MS = 500;

export type RotatorSponsor = {
  id: string;
  name: string;
  logoUrl: string | null;
  linkUrl: string | null;
};

type Props = {
  championshipSlug: string;
  items: RotatorSponsor[];
  variant?: "left" | "right";
};

function trackEvent(slug: string, sponsorId: string, type: "impression" | "click") {
  void fetch(`/api/public/championships/${encodeURIComponent(slug)}/sponsors/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sponsorId, type }),
    keepalive: type === "click",
  }).catch(() => {});
}

export function ChampionshipSponsorsRotator({
  championshipSlug,
  items,
  variant = "left",
}: Props) {
  const idsKey = useMemo(() => items.map((i) => i.id).join(","), [items]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const [bag, setBag] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);
  const bagRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const lastTrackedId = useRef<string | null>(null);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ids = items.map((i) => i.id);
    const nextBag = createSponsorRotationBag(ids);
    bagRef.current = nextBag;
    indexRef.current = 0;
    setBag(nextBag);
    setIndex(0);
    setFadeIn(true);
    lastTrackedId.current = null;
  }, [idsKey, items]);

  const currentId = bag[index] ?? null;
  const current = currentId ? byId.get(currentId) : null;

  const recordImpression = useCallback(
    (sponsorId: string) => {
      if (lastTrackedId.current === sponsorId) return;
      lastTrackedId.current = sponsorId;
      trackEvent(championshipSlug, sponsorId, "impression");
    },
    [championshipSlug]
  );

  useEffect(() => {
    if (currentId) recordImpression(currentId);
  }, [currentId, recordImpression]);

  useEffect(() => {
    if (items.length <= 1) return;

    const ids = items.map((i) => i.id);
    const timer = setInterval(() => {
      setFadeIn(false);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        const next = advanceSponsorRotation(bagRef.current, indexRef.current, ids);
        bagRef.current = next.bag;
        indexRef.current = next.index;
        setBag(next.bag);
        setIndex(next.index);
        setFadeIn(true);
      }, FADE_MS);
    }, ROTATION_MS);

    return () => {
      clearInterval(timer);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [idsKey, items.length]);

  if (!current) return null;

  const src = normalizeImageSrc(current.logoUrl);
  const imageClass = "h-auto w-full max-h-[20rem] object-contain";

  const content = src ? (
    <SafeImage
      src={src}
      alt={current.name}
      width={400}
      height={200}
      className={imageClass}
    />
  ) : (
    <span className="text-sm font-medium text-foreground">{current.name}</span>
  );

  const shell = (
    <div
      className={cn(
        "flex min-h-[5.5rem] w-full items-center justify-center transition-opacity ease-in-out",
        fadeIn ? "opacity-100" : "opacity-0"
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      {content}
    </div>
  );

  if (current.linkUrl) {
    return (
      <Link
        href={current.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackEvent(championshipSlug, current.id, "click")}
        className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label={`Patrocinador: ${current.name}`}
      >
        {shell}
      </Link>
    );
  }

  return shell;
}
