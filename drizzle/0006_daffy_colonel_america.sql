CREATE TABLE `testDriveBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carId` int NOT NULL,
	`dealerId` int NOT NULL,
	`preferredDate` timestamp NOT NULL,
	`preferredTime` varchar(20),
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(320) NOT NULL,
	`customerPhone` varchar(20) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testDriveBookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `testDriveBookings` ADD CONSTRAINT `testDriveBookings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testDriveBookings` ADD CONSTRAINT `testDriveBookings_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testDriveBookings` ADD CONSTRAINT `testDriveBookings_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;