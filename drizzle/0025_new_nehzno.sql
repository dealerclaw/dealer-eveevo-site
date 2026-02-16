ALTER TABLE `cars` ADD `inventoryHealthRating` enum('green','amber','blue') DEFAULT 'green';--> statement-breakpoint
ALTER TABLE `cars` ADD `originalPrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `cars` ADD `priceChangePercentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `cars` ADD `daysOnMarket` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `cars` ADD `lastHealthCheck` timestamp;