CREATE TABLE `dealerReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealerId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`purchaseId` int,
	`isVerified` boolean DEFAULT false,
	`isVisible` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dealers` ADD `reviewCount` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `dealers` ADD `businessHours` text;--> statement-breakpoint
ALTER TABLE `dealerReviews` ADD CONSTRAINT `dealerReviews_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerReviews` ADD CONSTRAINT `dealerReviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;