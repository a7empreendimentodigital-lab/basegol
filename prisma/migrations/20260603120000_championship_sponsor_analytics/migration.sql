-- Métricas de patrocinadores (impressões/cliques). Idempotente para re-deploy.

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_sponsors'
    AND COLUMN_NAME = 'impressionCount'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_sponsors` ADD COLUMN `impressionCount` INTEGER NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_sponsors'
    AND COLUMN_NAME = 'clickCount'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_sponsors` ADD COLUMN `clickCount` INTEGER NOT NULL DEFAULT 0'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_sponsors'
    AND COLUMN_NAME = 'lastImpressionAt'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_sponsors` ADD COLUMN `lastImpressionAt` DATETIME(3) NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'championship_sponsors'
    AND COLUMN_NAME = 'lastClickAt'
);
SET @sql := IF(
  @exists > 0,
  'SELECT 1',
  'ALTER TABLE `championship_sponsors` ADD COLUMN `lastClickAt` DATETIME(3) NULL'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
