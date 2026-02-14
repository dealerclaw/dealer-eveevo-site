CREATE TABLE `dealerCart` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`carId` int NOT NULL,
	`priceAtAdd` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealerCart_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealerWatchlist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`carId` int NOT NULL,
	`initialPrice` decimal(10,2) NOT NULL,
	`lastNotifiedPrice` decimal(10,2),
	`alertOnPriceDrop` boolean DEFAULT true,
	`alertThreshold` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerWatchlist_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dealerCart` ADD CONSTRAINT `dealerCart_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerCart` ADD CONSTRAINT `dealerCart_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerWatchlist` ADD CONSTRAINT `dealerWatchlist_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerWatchlist` ADD CONSTRAINT `dealerWatchlist_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;