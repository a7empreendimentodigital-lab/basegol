type Props = {
  children: React.ReactNode;
};

/** Configurações / perfil — sem sidebar de campeonato (evita confusão com dados públicos). */
export function SettingsPageLayout({ children }: Props) {
  return <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>;
}
