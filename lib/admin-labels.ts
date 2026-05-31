export const CHAMPIONSHIP_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  REGISTRATION: "Inscrições",
  ACTIVE: "Ativo",
  FINISHED: "Encerrado",
  CANCELLED: "Cancelado",
};

export const CLUB_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  SUSPENDED: "Suspenso",
};

export const ATHLETE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INJURED: "Lesionado",
  SUSPENDED: "Suspenso",
  INACTIVE: "Inativo",
  PENDING_DOCS: "Docs pendentes",
};

export const MATCH_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  LIVE: "Ao vivo",
  HALFTIME: "Intervalo",
  FINISHED: "Finalizado",
  POSTPONED: "Adiado",
  CANCELLED: "Cancelado",
};

export const MATCH_EVENT_LABELS: Record<string, string> = {
  GOAL: "Gol",
  OWN_GOAL: "Gol contra",
  PENALTY_GOAL: "Pênalti convertido",
  PENALTY_MISS: "Pênalti perdido",
  YELLOW_CARD: "Cartão amarelo",
  RED_CARD: "Cartão vermelho",
  SUBSTITUTION: "Substituição",
  VAR: "VAR",
  HALFTIME: "Intervalo",
  FULLTIME: "Fim de jogo",
  KICKOFF: "Início / reinício",
};

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  IDENTITY: "Identidade",
  MEDICAL: "Médico",
  AUTHORIZATION: "Autorização",
  REGISTRATION_FORM: "Ficha de inscrição",
  OTHER: "Outro",
};

export const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

export const PLAYER_POSITION_LABELS: Record<string, string> = {
  GK: "Goleiro",
  CB: "Zagueiro",
  LB: "Lateral esq.",
  RB: "Lateral dir.",
  CDM: "Volante",
  CM: "Meia",
  CAM: "Meia atacante",
  LW: "Ponta esq.",
  RW: "Ponta dir.",
  ST: "Atacante",
  CF: "Centroavante",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  BANNED: "Bloqueado",
};

export const STAFF_ROLE_LABELS: Record<string, string> = {
  HEAD_COACH: "Técnico principal",
  ASSISTANT_COACH: "Auxiliar técnico",
  GOALKEEPER_COACH: "Prep. de goleiros",
  PHYSIO: "Fisioterapeuta",
  ANALYST: "Analista",
  MANAGER: "Gerente",
};

export const CATEGORY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const GROUP_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
};

export const MENU_AREA_LABELS: Record<string, string> = {
  PUBLIC: "Site público",
  ADMIN: "Painel admin",
  CLUBE: "Portal do clube",
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN_LIGA: "Admin da Liga",
  CLUBE: "Clube",
  OPERADOR_DE_PARTIDA: "Operador de Jogo",
  SCOUT: "Scout",
  VISITANTE: "Visitante",
};
