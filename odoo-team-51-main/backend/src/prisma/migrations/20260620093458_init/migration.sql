-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `loginId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `mobile` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `photoUrl` VARCHAR(191) NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_loginId_key`(`loginId`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `module` ENUM('sales', 'purchase', 'manufacturing', 'product') NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `canCreate` BOOLEAN NOT NULL DEFAULT false,
    `canView` BOOLEAN NOT NULL DEFAULT false,
    `canEdit` BOOLEAN NOT NULL DEFAULT false,
    `canDelete` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `permissions_userId_module_field_key`(`userId`, `module`, `field`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `customers_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `contact` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vendors_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendor_quality_incidents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vendorId` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `severity` ENUM('low', 'medium', 'high') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dimensions` VARCHAR(191) NULL,
    `specifications` VARCHAR(191) NULL,
    `leadTimeDays` INTEGER NULL,
    `movementRate` DOUBLE NULL,
    `minOrderQty` DECIMAL(12, 2) NULL,
    `lowStockThreshold` DECIMAL(12, 2) NULL,
    `salesPrice` DECIMAL(12, 2) NOT NULL,
    `costPrice` DECIMAL(12, 2) NOT NULL,
    `onHandQty` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `procureOnDemand` BOOLEAN NOT NULL DEFAULT false,
    `procurementMethod` ENUM('purchase', 'manufacturing') NULL,
    `vendorId` INTEGER NULL,
    `bomId` INTEGER NULL,
    `photoUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `products_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `boms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `productId` INTEGER NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `boms_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bomId` INTEGER NOT NULL,
    `componentId` INTEGER NOT NULL,
    `toConsumeQty` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bom_work_order_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bomId` INTEGER NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `workCenterId` INTEGER NOT NULL,
    `expectedDurationMins` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `work_centers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `shiftCapacityMins` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `customerId` INTEGER NOT NULL,
    `customerAddress` VARCHAR(191) NULL,
    `salesPersonId` INTEGER NULL,
    `status` ENUM('draft', 'confirmed', 'partially_delivered', 'fully_delivered', 'cancelled') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `sales_orders_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_order_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `salesOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `orderedQty` DECIMAL(12, 2) NOT NULL,
    `deliveredQty` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `salesUnitPrice` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `vendorId` INTEGER NOT NULL,
    `vendorAddress` VARCHAR(191) NULL,
    `responsiblePersonId` INTEGER NULL,
    `status` ENUM('draft', 'confirmed', 'partially_received', 'fully_received', 'cancelled') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `purchase_orders_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_order_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchaseOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `orderedQty` DECIMAL(12, 2) NOT NULL,
    `receivedQty` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `costUnitPrice` DECIMAL(12, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manufacturing_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(191) NOT NULL,
    `finishedProductId` INTEGER NOT NULL,
    `quantity` DECIMAL(12, 2) NOT NULL,
    `bomId` INTEGER NULL,
    `scheduleDate` DATETIME(3) NULL,
    `assigneeId` INTEGER NULL,
    `status` ENUM('draft', 'confirmed', 'in_progress', 'done', 'cancelled') NOT NULL DEFAULT 'draft',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `manufacturing_orders_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mo_components` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `manufacturingOrderId` INTEGER NOT NULL,
    `productId` INTEGER NOT NULL,
    `toConsumeQty` DECIMAL(12, 2) NOT NULL,
    `consumedQty` DECIMAL(12, 2) NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mo_work_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `manufacturingOrderId` INTEGER NOT NULL,
    `operation` VARCHAR(191) NOT NULL,
    `workCenterId` INTEGER NOT NULL,
    `expectedDurationMins` INTEGER NOT NULL,
    `realDurationMins` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_ledger` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `qtyChange` DECIMAL(12, 2) NOT NULL,
    `refType` VARCHAR(191) NOT NULL,
    `refId` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `procurement_links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `parentType` ENUM('sales_order', 'purchase_order', 'manufacturing_order') NOT NULL,
    `parentId` INTEGER NOT NULL,
    `childType` ENUM('sales_order', 'purchase_order', 'manufacturing_order') NOT NULL,
    `childId` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `procurement_links_childType_childId_idx`(`childType`, `childId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `market_signals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sourceType` ENUM('carpenter', 'contractor', 'dealer', 'supplier', 'warehouse_partner', 'transporter', 'employee', 'procurement_partner') NOT NULL,
    `productId` INTEGER NULL,
    `category` VARCHAR(191) NULL,
    `signalType` ENUM('shortage', 'price_change', 'delay', 'availability') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `severity` ENUM('low', 'medium', 'high') NOT NULL,
    `reportedByUserId` INTEGER NOT NULL,
    `reportedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity` VARCHAR(191) NOT NULL,
    `recordId` INTEGER NOT NULL,
    `action` ENUM('created', 'updated', 'deleted') NOT NULL,
    `fieldChanged` VARCHAR(191) NULL,
    `oldValue` VARCHAR(191) NULL,
    `newValue` VARCHAR(191) NULL,
    `userId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entity_recordId_idx`(`entity`, `recordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_communications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `channel` ENUM('email', 'sms', 'portal_message') NOT NULL,
    `direction` ENUM('inbound', 'outbound') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `salesOrderId` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendor_quality_incidents` ADD CONSTRAINT `vendor_quality_incidents_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_bomId_fkey` FOREIGN KEY (`bomId`) REFERENCES `boms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `boms` ADD CONSTRAINT `boms_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_lines` ADD CONSTRAINT `bom_lines_bomId_fkey` FOREIGN KEY (`bomId`) REFERENCES `boms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_lines` ADD CONSTRAINT `bom_lines_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_work_order_templates` ADD CONSTRAINT `bom_work_order_templates_bomId_fkey` FOREIGN KEY (`bomId`) REFERENCES `boms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bom_work_order_templates` ADD CONSTRAINT `bom_work_order_templates_workCenterId_fkey` FOREIGN KEY (`workCenterId`) REFERENCES `work_centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_orders` ADD CONSTRAINT `sales_orders_salesPersonId_fkey` FOREIGN KEY (`salesPersonId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_lines` ADD CONSTRAINT `sales_order_lines_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_order_lines` ADD CONSTRAINT `sales_order_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_responsiblePersonId_fkey` FOREIGN KEY (`responsiblePersonId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_lines` ADD CONSTRAINT `purchase_order_lines_purchaseOrderId_fkey` FOREIGN KEY (`purchaseOrderId`) REFERENCES `purchase_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_order_lines` ADD CONSTRAINT `purchase_order_lines_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manufacturing_orders` ADD CONSTRAINT `manufacturing_orders_finishedProductId_fkey` FOREIGN KEY (`finishedProductId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manufacturing_orders` ADD CONSTRAINT `manufacturing_orders_bomId_fkey` FOREIGN KEY (`bomId`) REFERENCES `boms`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manufacturing_orders` ADD CONSTRAINT `manufacturing_orders_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mo_components` ADD CONSTRAINT `mo_components_manufacturingOrderId_fkey` FOREIGN KEY (`manufacturingOrderId`) REFERENCES `manufacturing_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mo_components` ADD CONSTRAINT `mo_components_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mo_work_orders` ADD CONSTRAINT `mo_work_orders_manufacturingOrderId_fkey` FOREIGN KEY (`manufacturingOrderId`) REFERENCES `manufacturing_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mo_work_orders` ADD CONSTRAINT `mo_work_orders_workCenterId_fkey` FOREIGN KEY (`workCenterId`) REFERENCES `work_centers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledger` ADD CONSTRAINT `stock_ledger_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_ledger` ADD CONSTRAINT `stock_ledger_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `market_signals` ADD CONSTRAINT `market_signals_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `market_signals` ADD CONSTRAINT `market_signals_reportedByUserId_fkey` FOREIGN KEY (`reportedByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_communications` ADD CONSTRAINT `customer_communications_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_reviews` ADD CONSTRAINT `customer_reviews_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `customer_reviews` ADD CONSTRAINT `customer_reviews_salesOrderId_fkey` FOREIGN KEY (`salesOrderId`) REFERENCES `sales_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
