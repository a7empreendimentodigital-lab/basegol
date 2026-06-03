import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Apenas estrutura do sistema + usuário master. Sem clubes, jogos ou conteúdo de exemplo. */
async function main() {
  console.log("🌱 Seed BASEGOL (estrutura mínima)...");

  const rolesSeed = [
    { slug: "SUPER_ADMIN", name: "Super Admin", permissions: ["*"] },
    {
      slug: "ADMIN_LIGA",
      name: "Admin da Liga",
      permissions: [
        "championship:*",
        "club:*",
        "match:*",
        "news:*",
        "standing:*",
        "sponsor:*",
        "user:read",
      ],
    },
    {
      slug: "ADMIN_CAMPEONATO",
      name: "Admin do Campeonato",
      permissions: [
        "championship:scoped:*",
        "club:*",
        "match:*",
        "news:*",
        "standing:*",
        "sponsor:scoped:*",
        "user:scoped:read",
      ],
    },
    {
      slug: "CLUBE",
      name: "Clube",
      permissions: ["club:own:*", "athlete:own:*", "document:own:*"],
    },
    {
      slug: "OPERADOR_DE_PARTIDA",
      name: "Operador de Partida",
      permissions: ["match:update-live", "match:event:*", "match:stat:*", "match:lifecycle:*"],
    },
    { slug: "SCOUT", name: "Scout", permissions: ["athlete:read", "statistics:read"] },
    { slug: "VISITANTE", name: "Visitante", permissions: ["public:read"] },
  ] as const;

  const roleMap = new Map<string, string>();
  for (const role of rolesSeed) {
    const dbRole = await prisma.role.upsert({
      where: { slug: role.slug },
      update: { name: role.name, permissions: role.permissions as unknown as object },
      create: {
        slug: role.slug,
        name: role.name,
        permissions: role.permissions as unknown as object,
      },
    });
    roleMap.set(role.slug, dbRole.id);
  }

  const permissionCodes = [...new Set(rolesSeed.flatMap((role) => role.permissions))];
  const permissionMap = new Map<string, string>();
  for (const code of permissionCodes) {
    const permission = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, name: code.replace(/[:*]/g, " ").trim(), group: code.split(":")[0] },
    });
    permissionMap.set(code, permission.id);
  }

  for (const role of rolesSeed) {
    for (const code of role.permissions) {
      const roleId = roleMap.get(role.slug)!;
      const permissionId = permissionMap.get(code)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
  }

  const masterPassword = "Master#2026!";
  const passwordHash = await bcrypt.hash(masterPassword, 12);
  await prisma.user.upsert({
    where: { email: "master@basegol.com.br" },
    update: {
      name: "Master BaseGol",
      passwordHash,
      roleId: roleMap.get("SUPER_ADMIN")!,
      status: "ACTIVE",
      mustChangePassword: false,
    },
    create: {
      name: "Master BaseGol",
      email: "master@basegol.com.br",
      passwordHash,
      roleId: roleMap.get("SUPER_ADMIN")!,
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "theme.base" },
    update: {},
    create: {
      key: "theme.base",
      value: {
        background: "#050505",
        card: "#0f0f13",
        neonPrimary: "#39ff14",
        neonSecondary: "#00c853",
        textPrimary: "#ffffff",
      },
    },
  });

  const activeThemes = await prisma.themeConfig.findMany({ where: { isActive: true } });
  if (activeThemes.length === 0) {
    await prisma.themeConfig.create({
      data: {
        name: "BaseGol",
        isActive: true,
        primaryColor: "#0e7a3b",
        secondaryColor: "#16c05b",
        backgroundColor: "#050505",
        cardColor: "#0f0f13",
        textPrimary: "#ffffff",
        textSecondary: "#9ca3af",
        borderColor: "rgba(161,161,170,0.09)",
      },
    });
  }

  const brandCount = await prisma.brandConfig.count();
  if (brandCount === 0) {
    await prisma.brandConfig.create({
      data: {
        systemName: "BASEGOL",
        slogan: "O futuro do futebol paulista começa aqui",
        logoUrl: "/assets/logo.webp",
        faviconUrl: "/assets/favicon.webp",
        mobileLogoUrl: "/assets/favicon.webp",
        loginBackgroundUrl: "/assets/bannerpricipal.webp",
        homeHeroBackgroundUrl: "/assets/bannerpricipal.webp",
      },
    });
  }

  const sectorAccounts = [
    {
      email: "liga@basegol.com.br",
      name: "Admin Liga",
      password: "Liga#2026!",
      roleSlug: "ADMIN_LIGA",
    },
    {
      email: "clube@basegol.com.br",
      name: "Gestor Clube",
      password: "Clube#2026!",
      roleSlug: "CLUBE",
    },
    {
      email: "operador@basegol.com.br",
      name: "Operador de Jogo",
      password: "Operador#2026!",
      roleSlug: "OPERADOR_DE_PARTIDA",
    },
    {
      email: "scout@basegol.com.br",
      name: "Scout",
      password: "Scout#2026!",
      roleSlug: "SCOUT",
    },
  ] as const;

  const firstClub = await prisma.club.findFirst({
    where: { status: "APPROVED" },
    orderBy: { name: "asc" },
  });

  for (const account of sectorAccounts) {
    const roleId = roleMap.get(account.roleSlug)!;
    const hash = await bcrypt.hash(account.password, 12);
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        passwordHash: hash,
        roleId,
        status: "ACTIVE",
        mustChangePassword: true,
      },
      create: {
        name: account.name,
        email: account.email,
        passwordHash: hash,
        roleId,
        status: "ACTIVE",
        mustChangePassword: true,
      },
    });

    if (account.roleSlug === "CLUBE" && firstClub) {
      await prisma.clubUser.deleteMany({ where: { userId: user.id } });
      await prisma.clubUser.create({
        data: { userId: user.id, clubId: firstClub.id, role: "OWNER" },
      });
    }
  }

  console.log("✅ Seed mínimo concluído.");
  console.log("   Master:     master@basegol.com.br / Master#2026!");
  console.log("   Liga:       liga@basegol.com.br / Liga#2026!  → /admin");
  console.log("   Clube:      clube@basegol.com.br / Clube#2026! → /clube");
  console.log("     (vincula ao 1º clube aprovado" + (firstClub ? `: ${firstClub.name}` : " — cadastre um clube antes") + ")");
  console.log("   Operador:   operador@basegol.com.br / Operador#2026! → /operador");
  console.log("   Scout:      scout@basegol.com.br / Scout#2026! → site público");
  console.log("   Atribua partidas ao operador em Admin → Usuários.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
