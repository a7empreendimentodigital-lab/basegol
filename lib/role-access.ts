import type { AppRole } from "@/lib/rbac";

export type RoleSectorInfo = {
  label: string;
  loginPath: string;
  description: string;
};

/** Para onde cada papel vai após o login (sem troca de senha pendente). */
export const ROLE_SECTOR_INFO: Record<AppRole, RoleSectorInfo> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    loginPath: "/admin",
    description: "Painel completo da liga — campeonatos, clubes, jogos, CMS e usuários.",
  },
  ADMIN_LIGA: {
    label: "Admin da Liga",
    loginPath: "/admin",
    description: "Gestão operacional da competição (sem exclusão de super admin).",
  },
  ADMIN_CAMPEONATO: {
    label: "Admin do Campeonato",
    loginPath: "/admin",
    description: "Gestão de um campeonato — clubes, jogos, categorias e patrocinadores.",
  },
  CLUBE: {
    label: "Clube",
    loginPath: "/clube",
    description: "Área do clube — atletas, documentos, inscrições e jogos do time vinculado.",
  },
  OPERADOR_DE_PARTIDA: {
    label: "Operador de jogo",
    loginPath: "/operador",
    description: "Placar ao vivo apenas nas partidas atribuídas a este usuário.",
  },
  SCOUT: {
    label: "Scout",
    loginPath: "/",
    description: "Consulta pública — atletas, estatísticas e campeonatos.",
  },
  VISITANTE: {
    label: "Visitante",
    loginPath: "/",
    description: "Site público — favoritos e perfil (conta criada pelo próprio usuário).",
  },
};

/** Papéis que o admin pode criar manualmente (visitante = cadastro público). */
export const ADMIN_CREATABLE_ROLE_SLUGS = [
  "ADMIN_LIGA",
  "ADMIN_CAMPEONATO",
  "CLUBE",
  "OPERADOR_DE_PARTIDA",
  "SCOUT",
] as const;

export type AdminCreatableRole = (typeof ADMIN_CREATABLE_ROLE_SLUGS)[number];

export function rolesCreatableBy(actorRole: string): AdminCreatableRole[] {
  const actor = actorRole.toUpperCase();
  if (actor === "SUPER_ADMIN") {
    return [...ADMIN_CREATABLE_ROLE_SLUGS];
  }
  if (actor === "ADMIN_LIGA") {
    return ADMIN_CREATABLE_ROLE_SLUGS.filter((r) => r !== "ADMIN_LIGA");
  }
  if (actor === "ADMIN_CAMPEONATO") {
    return ["OPERADOR_DE_PARTIDA"];
  }
  return [];
}

export function canAssignRole(actorRole: string, targetRoleSlug: string): boolean {
  const actor = actorRole.toUpperCase();
  const target = targetRoleSlug.toUpperCase();

  if (target === "VISITANTE") return false;

  if (target === "SUPER_ADMIN") {
    return actor === "SUPER_ADMIN";
  }

  return rolesCreatableBy(actor).includes(target as AdminCreatableRole);
}
