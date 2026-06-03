-- Vínculo usuário ↔ campeonato e patrocinadores por campeonato.
-- Idempotente: seguro se as tabelas já existirem (db push) ou se as FKs já foram criadas.

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

    INDEX `ch_sponsors_champ_placement_idx`(`championshipId`, `placement`, `isActive`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- FK championship_members.userId → users.id
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_members'
    AND CONSTRAINT_NAME = 'championship_members_userId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_members` ADD CONSTRAINT `championship_members_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK championship_members.championshipId → championships.id
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_members'
    AND CONSTRAINT_NAME = 'championship_members_championshipId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_members` ADD CONSTRAINT `championship_members_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- FK championship_sponsors.championshipId → championships.id
SET @exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_sponsors'
    AND CONSTRAINT_NAME = 'championship_sponsors_championshipId_fkey'
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_sponsors` ADD CONSTRAINT `championship_sponsors_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
