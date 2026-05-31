/** Créditos do desenvolvedor — link e logo opcional em /public/assets/a7-developer.webp */
export const DEVELOPER_NAME = "A7 Empreendimento Digital";
export const DEVELOPER_URL = "https://alexmarinho.com/";

/** Logo local: public/assets/a7-developer.png (ou NEXT_PUBLIC_DEVELOPER_LOGO_URL). */
export const DEVELOPER_LOGO_PATH = "/assets/a7-developer.png";

export function resolveDeveloperLogoUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_DEVELOPER_LOGO_URL?.trim();
  if (fromEnv) return fromEnv;
  return DEVELOPER_LOGO_PATH;
}
