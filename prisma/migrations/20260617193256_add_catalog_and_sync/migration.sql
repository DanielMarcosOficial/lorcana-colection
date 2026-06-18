-- CreateTable
CREATE TABLE `card_sets` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `releasedAt` DATETIME(3) NULL,
    `prereleasedAt` DATETIME(3) NULL,
    `totalCards` INTEGER NOT NULL DEFAULT 0,
    `logoUrl` VARCHAR(191) NULL,
    `symbolUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastSyncedAt` DATETIME(3) NULL,

    UNIQUE INDEX `card_sets_externalId_key`(`externalId`),
    UNIQUE INDEX `card_sets_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cards` (
    `id` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `setId` VARCHAR(191) NOT NULL,
    `tcgplayerId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `collectorNumber` VARCHAR(191) NOT NULL,
    `rarity` VARCHAR(191) NOT NULL,
    `ink` VARCHAR(191) NULL,
    `cost` INTEGER NULL,
    `inkwell` BOOLEAN NOT NULL DEFAULT false,
    `type` JSON NOT NULL,
    `classifications` JSON NOT NULL,
    `strength` INTEGER NULL,
    `willpower` INTEGER NULL,
    `lore` INTEGER NULL,
    `moveCost` INTEGER NULL,
    `rulesText` TEXT NULL,
    `flavorText` TEXT NULL,
    `illustrators` JSON NOT NULL,
    `imageSmall` VARCHAR(191) NULL,
    `imageNormal` VARCHAR(191) NULL,
    `imageLarge` VARCHAR(191) NULL,
    `priceUsd` DECIMAL(10, 2) NULL,
    `priceUsdFoil` DECIMAL(10, 2) NULL,
    `priceUpdatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastSyncedAt` DATETIME(3) NULL,

    UNIQUE INDEX `cards_externalId_key`(`externalId`),
    INDEX `cards_name_idx`(`name`),
    INDEX `cards_setId_idx`(`setId`),
    INDEX `cards_rarity_idx`(`rarity`),
    INDEX `cards_ink_idx`(`ink`),
    INDEX `cards_collectorNumber_idx`(`collectorNumber`),
    UNIQUE INDEX `cards_setId_collectorNumber_key`(`setId`, `collectorNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_runs` (
    `id` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `setsCreated` INTEGER NOT NULL DEFAULT 0,
    `setsUpdated` INTEGER NOT NULL DEFAULT 0,
    `cardsCreated` INTEGER NOT NULL DEFAULT 0,
    `cardsUpdated` INTEGER NOT NULL DEFAULT 0,
    `cardsSkipped` INTEGER NOT NULL DEFAULT 0,
    `errorCount` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_errors` (
    `id` VARCHAR(191) NOT NULL,
    `syncRunId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NULL,
    `message` TEXT NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_setId_fkey` FOREIGN KEY (`setId`) REFERENCES `card_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sync_errors` ADD CONSTRAINT `sync_errors_syncRunId_fkey` FOREIGN KEY (`syncRunId`) REFERENCES `sync_runs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
