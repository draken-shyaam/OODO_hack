-- AlterTable
ALTER TABLE `purchase_orders` ADD COLUMN `dueDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `sales_orders` ADD COLUMN `dueDate` DATETIME(3) NULL;
