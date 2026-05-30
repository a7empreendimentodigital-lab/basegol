/**
 * Garante usuário master no banco (produção Railway ou local).
 * Uso: npx tsx scripts/ensure-master-user.ts
 *
 * Credenciais padrão após execução:
 *   master@basegol.com.br / Master#2026!
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const MASTER_EMAIL = "master@basegol.com.br";
const MASTER_PASSWORD = process.env.MASTER_PASSWORD ?? "Master#2026!";
const MASTER_NAME = "Master BaseGol";

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("[ensure-master] DATABASE_URL não definida.");
    process.exit(1);
  }

  const hostHint = dbUrl.replace(/:[^:@]+@/, ":****@");
  console.log(`[ensure-master] Conectando em ${hostHint}`);

  let role = await prisma.role.findUnique({ where: { slug: "SUPER_ADMIN" } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        slug: "SUPER_ADMIN",
        name: "Super Admin",
        permissions: ["*"],
      },
    });
    console.log("[ensure-master] Role SUPER_ADMIN criada.");
  }

  const passwordHash = await hashPassword(MASTER_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: MASTER_EMAIL },
    update: {
      name: MASTER_NAME,
      passwordHash,
      roleId: role.id,
      status: "ACTIVE",
      mustChangePassword: false,
    },
    create: {
      email: MASTER_EMAIL,
      name: MASTER_NAME,
      passwordHash,
      roleId: role.id,
      status: "ACTIVE",
      mustChangePassword: false,
    },
  });

  console.log("[ensure-master] OK");
  console.log(`  id:     ${user.id}`);
  console.log(`  email:  ${MASTER_EMAIL}`);
  console.log(`  senha:  ${MASTER_PASSWORD}`);
  console.log(`  status: ${user.status}`);
}

main()
  .catch((e) => {
    console.error("[ensure-master] Falhou:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
