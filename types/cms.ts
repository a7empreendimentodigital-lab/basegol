export type ThemeConfigDTO = {
  id: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textPrimary: string;
  textSecondary: string;
  borderColor: string;
};

export type BrandConfigDTO = {
  id: string;
  systemName: string;
  slogan?: string | null;
  logoUrl?: string | null;
  mobileLogoUrl?: string | null;
  faviconUrl?: string | null;
  splashScreenUrl?: string | null;
  loginBackgroundUrl?: string | null;
  homeHeroBackgroundUrl?: string | null;
  portalContactUrl?: string | null;
  portalContactLabel?: string | null;
  socialInstagramUrl?: string | null;
  socialFacebookUrl?: string | null;
  socialYoutubeUrl?: string | null;
};
