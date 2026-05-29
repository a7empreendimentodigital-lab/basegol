import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MASTER_EMAIL = "master@basegol.com.br";

/**
 * Remove todos os dados operacionais e de demonstração.
 * Mantém: papéis, permissões, usuário master e configurações de marca/tema existentes.
 */
async function main() {
  console.log("🧹 Removendo dados demonstrativos do BASEGOL...");

  await prisma.$transaction(async (tx) => {
    await tx.matchOperator.deleteMany();
    await tx.lineup.deleteMany();
    await tx.matchEvent.deleteMany();
    await tx.matchStatistic.deleteMany();
    await tx.match.deleteMany();

    await tx.standingRow.deleteMany();
    await tx.standing.deleteMany();
    await tx.team.deleteMany();
    await tx.group.deleteMany();
    await tx.category.deleteMany();
    await tx.season.deleteMany();
    await tx.registration.deleteMany();
    await tx.document.deleteMany();
    await tx.athlete.deleteMany();
    await tx.staffMember.deleteMany();
    await tx.clubUser.deleteMany();
    await tx.club.deleteMany();
    await tx.championship.deleteMany();

    await tx.news.deleteMany();
    await tx.banner.deleteMany();
    await tx.sponsor.deleteMany();
    await tx.favorite.deleteMany();
    await tx.notification.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.mediaAsset.deleteMany();
    await tx.menuItem.deleteMany();
    await tx.siteText.deleteMany();
    await tx.siteSection.deleteMany();
    await tx.passwordResetToken.deleteMany();

    const demoUsers = await tx.user.findMany({
      where: { email: { not: MASTER_EMAIL } },
      select: { id: true },
    });
    const demoUserIds = demoUsers.map((u) => u.id);

    if (demoUserIds.length > 0) {
      await tx.account.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.session.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.setting.deleteMany({ where: { userId: { in: demoUserIds } } });
      await tx.user.deleteMany({ where: { id: { in: demoUserIds } } });
    }
  });

  const counts = await Promise.all([
    prisma.club.count(),
    prisma.championship.count(),
    prisma.match.count(),
    prisma.news.count(),
    prisma.user.count(),
  ]);

  console.log("✅ Limpeza concluída.");
  console.log(`   Clubes: ${counts[0]} | Campeonatos: ${counts[1]} | Jogos: ${counts[2]} | Notícias: ${counts[3]} | Usuários: ${counts[4]}`);
  console.log(`   Login admin: ${MASTER_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
