-- Proxy Bids table for automatic bidding
CREATE TABLE IF NOT EXISTS `proxyBids` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `carId` int NOT NULL,
  `dealerId` int NOT NULL,
  `userId` int NOT NULL,
  `maxBidAmount` decimal(10,2) NOT NULL,
  `currentBidAmount` decimal(10,2) NOT NULL,
  `incrementAmount` decimal(10,2) DEFAULT 100.00,
  `isActive` boolean DEFAULT true,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`carId`) REFERENCES `cars`(`id`),
  FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);
