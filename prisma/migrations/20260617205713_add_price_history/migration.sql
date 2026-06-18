-- CreateTable
CREATE TABLE `price_history` (
    `id` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `priceUsd` DECIMAL(10, 2) NULL,
    `priceUsdFoil` DECIMAL(10, 2) NULL,
    `recordedAt` DATE NOT NULL,
    `source` VARCHAR(191) NOT NULL DEFAULT 'lorcast',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `price_history_cardId_recordedAt_idx`(`cardId`, `recordedAt`),
    UNIQUE INDEX `price_history_cardId_source_recordedAt_key`(`cardId`, `source`, `recordedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `price_history` ADD CONSTRAINT `price_history_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
