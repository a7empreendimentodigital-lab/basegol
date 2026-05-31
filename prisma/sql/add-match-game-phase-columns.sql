-- Rodar no MySQL do Railway se a listagem de jogos falhar após o deploy de fases manuais.
-- Alternativa: DATABASE_URL="mysql://..." npx prisma db push

ALTER TABLE `matches`
  ADD COLUMN `currentPhase` ENUM('PRE_MATCH','PERIOD_1','INTERVAL_1','PERIOD_2','INTERVAL_2','PERIOD_3','PENALTIES','FINISHED') NOT NULL DEFAULT 'PRE_MATCH',
  ADD COLUMN `currentPhaseIndex` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `phaseDurationSeconds` INTEGER NOT NULL DEFAULT 1020,
  ADD COLUMN `phaseElapsedSeconds` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `phaseStartedAt` DATETIME(3) NULL,
  ADD COLUMN `isClockRunning` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `periodsConfigured` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `totalPeriods` INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN `hasIntervals` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `hasPenaltyShootout` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `penaltyBonusPointsEnabled` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `matchPeriodLabel` VARCHAR(191) NULL,
  ADD COLUMN `showTotalGameTime` BOOLEAN NOT NULL DEFAULT false;
