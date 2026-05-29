-- Clubes: nome normalizado para deduplicação
ALTER TABLE `clubs` ADD COLUMN `normalizedName` VARCHAR(191) NULL;
UPDATE `clubs` SET `normalizedName` = LOWER(TRIM(`name`)) WHERE `normalizedName` IS NULL;
UPDATE `clubs` c
INNER JOIN (
  SELECT `normalizedName`, MIN(`id`) AS keepId
  FROM `clubs`
  WHERE `normalizedName` IS NOT NULL
  GROUP BY `normalizedName`
  HAVING COUNT(*) > 1
) d ON c.`normalizedName` = d.`normalizedName` AND c.`id` <> d.keepId
SET c.`normalizedName` = CONCAT(c.`normalizedName`, '-', SUBSTRING(c.`id`, 1, 6));
ALTER TABLE `clubs` MODIFY `normalizedName` VARCHAR(191) NOT NULL;
CREATE UNIQUE INDEX `clubs_normalizedName_key` ON `clubs`(`normalizedName`);
CREATE INDEX `clubs_name_idx` ON `clubs`(`name`);

-- Grupos: nome único por categoria
CREATE UNIQUE INDEX `groups_categoryId_name_key` ON `groups`(`categoryId`, `name`);

-- Locais
CREATE TABLE `venues` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `normalizedName` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL DEFAULT 'SP',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `venues_normalizedName_key`(`normalizedName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Fases e turnos
CREATE TABLE `competition_phases` (
    `id` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `competition_phases_championshipId_slug_key`(`championshipId`, `slug`),
    UNIQUE INDEX `competition_phases_championshipId_name_key`(`championshipId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `competition_turns` (
    `id` VARCHAR(191) NOT NULL,
    `phaseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `competition_turns_phaseId_slug_key`(`phaseId`, `slug`),
    UNIQUE INDEX `competition_turns_phaseId_name_key`(`phaseId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `competition_rounds` (
    `id` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `phaseId` VARCHAR(191) NOT NULL,
    `turnId` VARCHAR(191) NOT NULL,
    `number` INTEGER NOT NULL,
    `label` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `competition_rounds_championshipId_phaseId_turnId_number_key`(`championshipId`, `phaseId`, `turnId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Importação
CREATE TABLE `schedule_imports` (
    `id` VARCHAR(191) NOT NULL,
    `championshipId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `summary` JSON NULL,
    `createdById` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NULL,
    `finishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `schedule_imports_championshipId_idx`(`championshipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `schedule_import_logs` (
    `id` VARCHAR(191) NOT NULL,
    `importId` VARCHAR(191) NOT NULL,
    `level` ENUM('INFO', 'WARN', 'ERROR') NOT NULL DEFAULT 'INFO',
    `code` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `schedule_import_logs_importId_idx`(`importId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Jogos: metadados de importação
ALTER TABLE `matches` ADD COLUMN `championshipId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `homeClubId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `awayClubId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `phaseId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `turnId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `competitionRoundId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `matchNumber` INTEGER NULL;
ALTER TABLE `matches` ADD COLUMN `venueId` VARCHAR(191) NULL;
ALTER TABLE `matches` ADD COLUMN `importFingerprint` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `matches_importFingerprint_key` ON `matches`(`importFingerprint`);
CREATE INDEX `matches_championshipId_idx` ON `matches`(`championshipId`);
CREATE INDEX `matches_phaseId_idx` ON `matches`(`phaseId`);
CREATE INDEX `matches_homeClubId_awayClubId_idx` ON `matches`(`homeClubId`, `awayClubId`);

ALTER TABLE `competition_phases` ADD CONSTRAINT `competition_phases_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `competition_turns` ADD CONSTRAINT `competition_turns_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `competition_phases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `competition_rounds` ADD CONSTRAINT `competition_rounds_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `competition_rounds` ADD CONSTRAINT `competition_rounds_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `competition_phases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `competition_rounds` ADD CONSTRAINT `competition_rounds_turnId_fkey` FOREIGN KEY (`turnId`) REFERENCES `competition_turns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `schedule_imports` ADD CONSTRAINT `schedule_imports_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `schedule_imports` ADD CONSTRAINT `schedule_imports_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `schedule_import_logs` ADD CONSTRAINT `schedule_import_logs_importId_fkey` FOREIGN KEY (`importId`) REFERENCES `schedule_imports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_championshipId_fkey` FOREIGN KEY (`championshipId`) REFERENCES `championships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_homeClubId_fkey` FOREIGN KEY (`homeClubId`) REFERENCES `clubs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_awayClubId_fkey` FOREIGN KEY (`awayClubId`) REFERENCES `clubs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_phaseId_fkey` FOREIGN KEY (`phaseId`) REFERENCES `competition_phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_turnId_fkey` FOREIGN KEY (`turnId`) REFERENCES `competition_turns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_competitionRoundId_fkey` FOREIGN KEY (`competitionRoundId`) REFERENCES `competition_rounds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `matches` ADD CONSTRAINT `matches_venueId_fkey` FOREIGN KEY (`venueId`) REFERENCES `venues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
