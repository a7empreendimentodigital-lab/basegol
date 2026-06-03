type Props = {
  children: React.ReactNode;
};

/** Páginas de conta (perfil, favoritos, configurações) — sem sidebar de campeonato. */
export function SettingsPageLayout({ children }: Props) {
  return <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>;
}
