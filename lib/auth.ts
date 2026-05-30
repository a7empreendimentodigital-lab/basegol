import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticateCredentials } from "@/lib/auth-credentials";

const secret = process.env.NEXTAUTH_SECRET;

if (!secret && process.env.NODE_ENV === "production") {
  console.error("[auth] NEXTAUTH_SECRET ausente em produção — login não funcionará.");
}

if (!process.env.NEXTAUTH_URL?.trim() && process.env.NODE_ENV === "production") {
  console.warn("[auth] NEXTAUTH_URL ausente — use a URL pública do deploy (ex.: https://seu-app.vercel.app).");
}

export const authOptions: NextAuthOptions = {
  secret,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await authenticateCredentials(
          credentials.email,
          credentials.password
        );

        if (!result.ok) {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.image,
          role: result.user.role,
          mustChangePassword: result.user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword;
        token.name = user.name ?? undefined;
        token.picture = user.image ?? undefined;
      }
      if (trigger === "update" && token.id) {
        const { prisma } = await import("@/lib/prisma");
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { role: true },
        });
        if (dbUser) {
          token.mustChangePassword = dbUser.mustChangePassword;
          token.role = dbUser.role.slug.toUpperCase();
          token.name = dbUser.name ?? undefined;
          token.picture = dbUser.image ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
};
