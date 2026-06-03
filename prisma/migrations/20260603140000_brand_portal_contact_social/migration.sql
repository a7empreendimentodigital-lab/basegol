-- Botão de contato e redes sociais do portal institucional. Idempotente.

SET @tbl := 'brand_configs';

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = 'portalContactUrl'
);
SET @sql := IF(@exists > 0, 'SELECT 1', 'ALTER TABLE `brand_configs` ADD COLUMN `portalContactUrl` VARCHAR(191) NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = 'portalContactLabel'
);
SET @sql := IF(@exists > 0, 'SELECT 1', 'ALTER TABLE `brand_configs` ADD COLUMN `portalContactLabel` VARCHAR(191) NULL DEFAULT ''Contato''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = 'socialInstagramUrl'
);
SET @sql := IF(@exists > 0, 'SELECT 1', 'ALTER TABLE `brand_configs` ADD COLUMN `socialInstagramUrl` VARCHAR(191) NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = 'socialFacebookUrl'
);
SET @sql := IF(@exists > 0, 'SELECT 1', 'ALTER TABLE `brand_configs` ADD COLUMN `socialFacebookUrl` VARCHAR(191) NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @tbl AND COLUMN_NAME = 'socialYoutubeUrl'
);
SET @sql := IF(@exists > 0, 'SELECT 1', 'ALTER TABLE `brand_configs` ADD COLUMN `socialYoutubeUrl` VARCHAR(191) NULL');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
