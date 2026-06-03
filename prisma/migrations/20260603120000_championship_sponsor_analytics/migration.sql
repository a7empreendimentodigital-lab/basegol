-- Métricas de patrocinadores (impressões/cliques) para monetização futura.

ALTER TABLE `championship_sponsors`
  ADD COLUMN `impressionCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `clickCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `lastImpressionAt` DATETIME(3) NULL,
  ADD COLUMN `lastClickAt` DATETIME(3) NULL;
