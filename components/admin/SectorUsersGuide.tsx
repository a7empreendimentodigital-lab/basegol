import { ROLE_SECTOR_INFO } from "@/lib/role-access";
import type { AppRole } from "@/lib/rbac";

const DEMO_ORDER: AppRole[] = [
  "ADMIN_LIGA",
  "CLUBE",
  "OPERADOR_DE_PARTIDA",
  "SCOUT",
];

export function SectorUsersGuide() {
  return (
    <div className="rounded-2xl border border-line bg-graphite-light/60 p-4 text-sm">
      <h2 className="font-semibold text-foreground">Setores e acesso</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Crie um usuário por setor, escolha o papel e salve. No primeiro login a senha pode ser
        alterada. Use o master para criar contas em{" "}
        <span className="font-mono text-foreground">/admin/usuarios</span>.
      </p>
      <ul className="mt-3 space-y-2">
        {DEMO_ORDER.map((slug) => {
          const info = ROLE_SECTOR_INFO[slug];
          return (
            <li
              key={slug}
              className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-line/60 pt-2 first:border-0 first:pt-0"
            >
              <span className="font-medium text-foreground">{info.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{info.loginPath}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Operador: marque as partidas no formulário do usuário. Clube: vincule ao clube cadastrado.
      </p>
    </div>
  );
}
