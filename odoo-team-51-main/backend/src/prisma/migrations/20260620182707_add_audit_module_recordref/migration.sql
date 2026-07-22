-- Add `module` and `recordRef` to audit_logs.
-- `module` is added with a temporary default so existing rows can be
-- backfilled from `entity`, then the default is dropped to match the
-- Prisma schema (which has no @default on this column).
ALTER TABLE `audit_logs` ADD COLUMN `module` ENUM('sales', 'purchase', 'manufacturing', 'product') NOT NULL DEFAULT 'product';
ALTER TABLE `audit_logs` ADD COLUMN `recordRef` VARCHAR(191) NULL;

UPDATE `audit_logs` SET `module` = 'sales' WHERE `entity` = 'SalesOrder';
UPDATE `audit_logs` SET `module` = 'purchase' WHERE `entity` = 'PurchaseOrder';
UPDATE `audit_logs` SET `module` = 'manufacturing' WHERE `entity` = 'ManufacturingOrder';
UPDATE `audit_logs` SET `module` = 'product' WHERE `entity` = 'Product';

ALTER TABLE `audit_logs` ALTER COLUMN `module` DROP DEFAULT;

CREATE INDEX `audit_logs_module_idx` ON `audit_logs`(`module`);
CREATE INDEX `audit_logs_createdAt_idx` ON `audit_logs`(`createdAt`);
