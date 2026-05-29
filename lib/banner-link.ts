export function isExternalBannerLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url);
}

export function bannerLinkProps(linkUrl: string | null | undefined) {
  if (!linkUrl) return { href: undefined as string | undefined };
  const external = isExternalBannerLink(linkUrl);
  return {
    href: linkUrl,
    target: external ? ("_blank" as const) : undefined,
    rel: external ? "noopener noreferrer sponsored" : undefined,
  };
}
