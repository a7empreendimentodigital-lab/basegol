import { SettingsPageLayout } from "@/components/layout/SettingsPageLayout";

/** Favoritos são globais — sem sidebar/patrocínio de campeonato via cookie. */
export default function FavoritosLayout({ children }: { children: React.ReactNode }) {
  return <SettingsPageLayout>{children}</SettingsPageLayout>;
}
