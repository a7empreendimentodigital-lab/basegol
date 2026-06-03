export type PortalSocialLink = {
  label: string;
  href: string;
};

export function portalContactHref(url: string | null | undefined, fallback = "/contato") {
  const t = url?.trim();
  if (!t) return fallback;
  return t;
}

export function isExternalPortalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function buildPortalSocialLinks(brand: {
  socialInstagramUrl?: string | null;
  socialFacebookUrl?: string | null;
  socialYoutubeUrl?: string | null;
}): PortalSocialLink[] {
  const items: PortalSocialLink[] = [];
  if (brand.socialInstagramUrl?.trim()) {
    items.push({ label: "Instagram", href: brand.socialInstagramUrl.trim() });
  }
  if (brand.socialFacebookUrl?.trim()) {
    items.push({ label: "Facebook", href: brand.socialFacebookUrl.trim() });
  }
  if (brand.socialYoutubeUrl?.trim()) {
    items.push({ label: "YouTube", href: brand.socialYoutubeUrl.trim() });
  }
  return items;
}
