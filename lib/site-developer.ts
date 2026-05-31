/** Créditos do desenvolvedor — link e logo opcional em /public/assets/a7-developer.webp */
export const DEVELOPER_NAME = "A7 Empreendimento Digital";
export const DEVELOPER_URL = "https://alexmarinho.com/";

/** Logo local: coloque o arquivo em public/assets/a7-developer.webp (ou defina NEXT_PUBLIC_DEVELOPER_LOGO_URL). */
export const DEVELOPER_LOGO_PATH = "/assets/a7-developer.webp";

export function resolveDeveloperLogoUrl(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_DEVELOPER_LOGO_URL?.trim();
  if (fromEnv) return fromEnv;
  return DEVELOPER_LOGO_PATH;
}
