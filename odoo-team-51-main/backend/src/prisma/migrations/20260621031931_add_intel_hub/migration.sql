-- AlterTable
ALTER TABLE `users` ADD COLUMN `intelStars` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `intel_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `postType` ENUM('new_supplier', 'cheaper_supplier', 'better_quality', 'faster_delivery', 'bulk_discount', 'local_supplier', 'alternative_material', 'excess_stock') NOT NULL,
    `materialName` VARCHAR(191) NOT NULL,
    `supplierName` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `price` DECIMAL(12, 2) NULL,
    `quantity` DECIMAL(12, 2) NULL,
    `contactInfo` VARCHAR(191) NULL,
    `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    `starsAwarded` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `createdByUserId` INTEGER NOT NULL,
    `verifiedByUserId` INTEGER NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `intel_posts_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intel_hub_views` (
    `userId` INTEGER NOT NULL,
    `lastViewedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `intel_posts` ADD CONSTRAINT `intel_posts_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intel_posts` ADD CONSTRAINT `intel_posts_verifiedByUserId_fkey` FOREIGN KEY (`verifiedByUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intel_hub_views` ADD CONSTRAINT `intel_hub_views_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
