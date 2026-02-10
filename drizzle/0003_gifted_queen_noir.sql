CREATE TABLE `carInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`userId` int,
	`dealerId` int,
	`name` varchar(255),
	`email` varchar(320),
	`phone` varchar(20),
	`message` text,
	`inquiryType` enum('test_drive','price_inquiry','general','finance') DEFAULT 'general',
	`status` enum('new','contacted','closed') DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carInquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`userId` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `carViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `carInquiries` ADD CONSTRAINT `carInquiries_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carInquiries` ADD CONSTRAINT `carInquiries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carInquiries` ADD CONSTRAINT `carInquiries_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carViews` ADD CONSTRAINT `carViews_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carViews` ADD CONSTRAINT `carViews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;