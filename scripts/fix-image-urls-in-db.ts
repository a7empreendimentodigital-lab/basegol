/**
 * Normaliza URLs de imagem no banco (Brasao → brasao, remove /public/, etc.).
 * Uso: npx tsx scripts/fix-image-urls-in-db.ts
 */
import { PrismaClient } from "@prisma/client";
import { normalizeImageSrc } from "../lib/image-url";

const prisma = new PrismaClient();

function fix(value: string | null | undefined): string | null {
  if (value == null) return null;
  return normalizeImageSrc(value);
}

async function main() {
  let updated = 0;

  const clubs = await prisma.club.findMany({
    where: { crestUrl: { not: null } },
    select: { id: true, crestUrl: true },
  });
  for (const c of clubs) {
    const next = fix(c.crestUrl);
    if (next && next !== c.crestUrl) {
      await prisma.club.update({ where: { id: c.id }, data: { crestUrl: next } });
      updated++;
    }
  }

  const brands = await prisma.brandConfig.findMany();
  for (const b of brands) {
    const data = {
      logoUrl: fix(b.logoUrl),
      faviconUrl: fix(b.faviconUrl),
      mobileLogoUrl: fix(b.mobileLogoUrl),
      loginBackgroundUrl: fix(b.loginBackgroundUrl),
      homeHeroBackgroundUrl: fix(b.homeHeroBackgroundUrl),
      splashScreenUrl: fix(b.splashScreenUrl),
    };
    const changed =
      data.logoUrl !== b.logoUrl ||
      data.faviconUrl !== b.faviconUrl ||
      data.mobileLogoUrl !== b.mobileLogoUrl ||
      data.loginBackgroundUrl !== b.loginBackgroundUrl ||
      data.homeHeroBackgroundUrl !== b.homeHeroBackgroundUrl ||
      data.splashScreenUrl !== b.splashScreenUrl;
    if (changed) {
      await prisma.brandConfig.update({ where: { id: b.id }, data });
      updated++;
    }
  }

  const banners = await prisma.banner.findMany({ select: { id: true, imageUrl: true } });
  for (const b of banners) {
    const next = fix(b.imageUrl);
    if (next && next !== b.imageUrl) {
      await prisma.banner.update({ where: { id: b.id }, data: { imageUrl: next } });
      updated++;
    }
  }

  const athletes = await prisma.athlete.findMany({
    where: { photoUrl: { not: null } },
    select: { id: true, photoUrl: true },
  });
  for (const a of athletes) {
    const next = fix(a.photoUrl);
    if (next && next !== a.photoUrl) {
      await prisma.athlete.update({ where: { id: a.id }, data: { photoUrl: next } });
      updated++;
    }
  }

  const championships = await prisma.championship.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, logoUrl: true },
  });
  for (const c of championships) {
    const next = fix(c.logoUrl);
    if (next && next !== c.logoUrl) {
      await prisma.championship.update({ where: { id: c.id }, data: { logoUrl: next } });
      updated++;
    }
  }

  const sponsors = await prisma.sponsor.findMany({
    where: { logoUrl: { not: null } },
    select: { id: true, logoUrl: true },
  });
  for (const s of sponsors) {
    const next = fix(s.logoUrl);
    if (next && next !== s.logoUrl) {
      await prisma.sponsor.update({ where: { id: s.id }, data: { logoUrl: next } });
      updated++;
    }
  }

  const media = await prisma.mediaAsset.findMany({ select: { id: true, url: true } });
  for (const m of media) {
    const next = fix(m.url);
    if (next && next !== m.url) {
      await prisma.mediaAsset.update({ where: { id: m.id }, data: { url: next } });
      updated++;
    }
  }

  const users = await prisma.user.findMany({
    where: { image: { not: null } },
    select: { id: true, image: true },
  });
  for (const u of users) {
    const next = fix(u.image);
    if (next && next !== u.image) {
      await prisma.user.update({ where: { id: u.id }, data: { image: next } });
      updated++;
    }
  }

  console.log(`Registros atualizados: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
