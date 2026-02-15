CREATE TABLE `auctionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`sellerDealerId` int NOT NULL,
	`auctionStartDate` timestamp NOT NULL,
	`auctionEndDate` timestamp NOT NULL,
	`reservePrice` decimal(10,2) NOT NULL,
	`status` enum('completed','expired_no_bids','expired_below_reserve','cancelled') NOT NULL,
	`winningBidId` int,
	`winnerDealerId` int,
	`finalPrice` decimal(10,2),
	`totalBids` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `auctionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auctionHistory` ADD CONSTRAINT `auctionHistory_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auctionHistory` ADD CONSTRAINT `auctionHistory_sellerDealerId_dealers_id_fk` FOREIGN KEY (`sellerDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auctionHistory` ADD CONSTRAINT `auctionHistory_winningBidId_dealerBids_id_fk` FOREIGN KEY (`winningBidId`) REFERENCES `dealerBids`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auctionHistory` ADD CONSTRAINT `auctionHistory_winnerDealerId_dealers_id_fk` FOREIGN KEY (`winnerDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;