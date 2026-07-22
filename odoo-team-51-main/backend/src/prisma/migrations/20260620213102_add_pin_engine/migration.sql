-- AlterTable
ALTER TABLE `market_signals` ADD COLUMN `expiresAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `sales_orders` ADD COLUMN `estimatedDeliveryAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `vendor_offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendorId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `unitPrice` DECIMAL(12, 2) NOT NULL,
    `leadTimeDays` INTEGER NOT NULL,
    `expediteAvailable` BOOLEAN NOT NULL DEFAULT false,
    `expediteFee` DECIMAL(12, 2) NULL,
    `expediteLeadDays` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vendor_offers_vendorId_productId_key`(`vendorId`, `productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vendor_offers` ADD CONSTRAINT `vendor_offers_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_offers` ADD CONSTRAINT `vendor_offers_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
