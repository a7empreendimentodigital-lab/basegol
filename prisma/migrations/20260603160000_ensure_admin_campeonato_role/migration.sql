-- Papel ADMIN_CAMPEONATO (produção sem seed completo). Idempotente.

INSERT INTO `roles` (`id`, `name`, `slug`, `description`, `permissions`, `createdAt`, `updatedAt`)
SELECT
  CONCAT('role_', SUBSTRING(REPLACE(UUID(), '-', ''), 1, 20)),
  'Admin do Campeonato',
  'ADMIN_CAMPEONATO',
  'Gestão de um campeonato específico',
  '["championship:scoped:*","club:*","match:*","news:*","standing:*","sponsor:scoped:*","user:scoped:read"]',
  NOW(3),
  NOW(3)
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `slug` = 'ADMIN_CAMPEONATO');
