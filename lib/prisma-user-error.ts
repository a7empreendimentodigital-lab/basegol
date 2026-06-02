import { Prisma } from "@prisma/client";

function uniqueFieldLabel(field: string): string | null {
  const f = field.toLowerCase();
  if (f.includes("slug")) return "identificador de URL (slug)";
  if (f.includes("normalizedname")) return "nome do clube";
  if (f.includes("email")) return "e-mail";
  return null;
}

export function formatPrismaError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : typeof target === "string"
          ? [target]
          : [];
      const label = fields.map(uniqueFieldLabel).find(Boolean);
      if (label) {
        return `Já existe outro registro com o mesmo ${label}. Ajuste o nome ou a sigla e tente novamente.`;
      }
      return "Já existe outro registro com os mesmos dados. Verifique nome, sigla ou URL.";
    }
    if (error.code === "P2025") {
      return "Registro não encontrado ou já foi removido.";
    }
    if (error.code === "P2003" || error.code === "P2014") {
      return "Este registro está vinculado a outros dados e não pode ser alterado assim.";
    }
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (
      msg.includes("clubs_slug_key") ||
      (msg.includes("Unique constraint failed") && msg.includes("slug"))
    ) {
      return "Já existe outro clube com o mesmo identificador de URL. Use um nome mais específico ou altere apenas a sigla.";
    }
    if (msg.includes("clubs_normalizedName_key") || msg.includes("normalizedName")) {
      return "Já existe outro clube cadastrado com este nome.";
    }
    if (msg.includes("Unique constraint failed")) {
      return "Já existe outro registro com os mesmos dados.";
    }
    if (!msg.toLowerCase().includes("prisma.") && !msg.includes("invocation")) {
      return msg;
    }
  }

  return "Não foi possível salvar. Verifique os dados e tente novamente.";
}
