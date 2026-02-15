CREATE TABLE `proxyBids` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`dealerId` int NOT NULL,
	`userId` int NOT NULL,
	`maxBidAmount` decimal(10,2) NOT NULL,
	`currentBidAmount` decimal(10,2) NOT NULL,
	`incrementAmount` decimal(10,2) DEFAULT '100.00',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proxyBids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `proxyBids` ADD CONSTRAINT `proxyBids_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proxyBids` ADD CONSTRAINT `proxyBids_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `proxyBids` ADD CONSTRAINT `proxyBids_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;