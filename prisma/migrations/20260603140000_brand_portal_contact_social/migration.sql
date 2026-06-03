-- Botão de contato e redes sociais do portal institucional (escolha de campeonato).

ALTER TABLE `brand_configs`
  ADD COLUMN `portalContactUrl` VARCHAR(191) NULL,
  ADD COLUMN `portalContactLabel` VARCHAR(191) NULL DEFAULT 'Contato',
  ADD COLUMN `socialInstagramUrl` VARCHAR(191) NULL,
  ADD COLUMN `socialFacebookUrl` VARCHAR(191) NULL,
  ADD COLUMN `socialYoutubeUrl` VARCHAR(191) NULL;
