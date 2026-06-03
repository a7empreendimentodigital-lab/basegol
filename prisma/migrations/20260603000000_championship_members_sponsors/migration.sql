-- Vínculo usuário ↔ campeonato e patrocinadores por campeonato.
-- Execute quando conveniente: npx prisma migrate deploy

CREATE TABLE IF NOT EXISTS `championship_members` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `championship_members_userId_championshipId_key`(`userId`, `championshipId`),
    INDEX `championship_members_championshipId_idx`(`championshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `championship_sponsors` (
    `id` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `linkUrl` VARCHAR(191) NULL,
    `placement` ENUM('SIDEBAR_LEFT', 'SIDEBAR_RIGHT') NOT NULL DEFAULT 'SIDEBAR_RIGHT',
    `order` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `championship_sponsors_championshipId_placement_isActive_order_idx`(`championshipId`, `placement`, `isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `championship_members` ADD CONSTRAINT `championship_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `championship_members` ADD CONSTRAINT `championship_members_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `championship_sponsors` ADD CONSTRAINT `championship_sponsors_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
