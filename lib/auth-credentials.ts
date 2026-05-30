import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export type AuthLoginFailure =
  | "missing_credentials"
  | "user_not_found"
  | "no_password"
  | "invalid_password"
  | "inactive_user"
  | "missing_role"
  | "database_error";

export type AuthUserPayload = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  mustChangePassword: boolean;
};

function logAuth(event: string, detail: Record<string, unknown>) {
  console.warn(`[auth] ${event}`, detail);
}

function normalizeLoginEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Autentica e-mail + senha contra o banco configurado em DATABASE_URL.
 */
export async function authenticateCredentials(
  emailRaw: string,
  password: string
): Promise<{ ok: true; user: AuthUserPayload } | { ok: false; reason: AuthLoginFailure }> {
  const email = normalizeLoginEmail(emailRaw);

  if (!email || !password) {
    logAuth("login_failed", { reason: "missing_credentials", email: email || "(empty)" });
    return { ok: false, reason: "missing_credentials" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      logAuth("login_failed", { reason: "user_not_found", email });
      return { ok: false, reason: "user_not_found" };
    }

    if (!user.role?.slug) {
      logAuth("login_failed", { reason: "missing_role", email, userId: user.id });
      return { ok: false, reason: "missing_role" };
    }

    if (user.status !== "ACTIVE") {
      logAuth("login_failed", {
        reason: "inactive_user",
        email,
        userId: user.id,
        status: user.status,
      });
      return { ok: false, reason: "inactive_user" };
    }

    const passwordCheck = await verifyPassword(password, user.passwordHash);
    if (!passwordCheck.ok) {
      logAuth("login_failed", {
        reason: passwordCheck.reason === "missing_hash" ? "no_password" : "invalid_password",
        email,
        userId: user.id,
        hashPresent: Boolean(user.passwordHash),
      });
      return {
        ok: false,
        reason: passwordCheck.reason === "missing_hash" ? "no_password" : "invalid_password",
      };
    }

    logAuth("login_success", { email, userId: user.id, role: user.role.slug });

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role.slug.toUpperCase(),
        mustChangePassword: user.mustChangePassword,
      },
    };
  } catch (error) {
    logAuth("login_failed", {
      reason: "database_error",
      email,
      message: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, reason: "database_error" };
  }
}
