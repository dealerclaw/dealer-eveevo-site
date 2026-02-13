CREATE TABLE `dealerBids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`dealerId` int NOT NULL,
	`userId` int NOT NULL,
	`bidAmount` decimal(10,2) NOT NULL,
	`message` text,
	`status` enum('active','outbid','winning','won','lost') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerBids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealerOffers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`fromDealerId` int NOT NULL,
	`toDealerId` int NOT NULL,
	`offerAmount` decimal(10,2) NOT NULL,
	`message` text,
	`status` enum('pending','accepted','rejected','countered','withdrawn') NOT NULL DEFAULT 'pending',
	`counterAmount` decimal(10,2),
	`counterMessage` text,
	`expiresAt` timestamp,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerOffers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cars` ADD `isAuction` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `cars` ADD `auctionStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `cars` ADD `auctionEndDate` timestamp;--> statement-breakpoint
ALTER TABLE `cars` ADD `startingBid` decimal(10,2);--> statement-breakpoint
ALTER TABLE `cars` ADD `reservePrice` decimal(10,2);--> statement-breakpoint
ALTER TABLE `cars` ADD `currentHighestBid` decimal(10,2);--> statement-breakpoint
ALTER TABLE `dealerBids` ADD CONSTRAINT `dealerBids_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerBids` ADD CONSTRAINT `dealerBids_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerBids` ADD CONSTRAINT `dealerBids_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerOffers` ADD CONSTRAINT `dealerOffers_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerOffers` ADD CONSTRAINT `dealerOffers_fromDealerId_dealers_id_fk` FOREIGN KEY (`fromDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerOffers` ADD CONSTRAINT `dealerOffers_toDealerId_dealers_id_fk` FOREIGN KEY (`toDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;