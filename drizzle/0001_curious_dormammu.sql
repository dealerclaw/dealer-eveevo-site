CREATE TABLE `cars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firebaseId` varchar(128),
	`dealerId` int,
	`make` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`year` int,
	`price` decimal(10,2),
	`mileage` int,
	`condition` enum('new','used') DEFAULT 'used',
	`bodyType` varchar(50),
	`color` varchar(50),
	`fuelType` varchar(50),
	`transmission` varchar(50),
	`batteryCapacity` decimal(6,2),
	`range` int,
	`chargingTime` varchar(100),
	`acceleration` varchar(50),
	`topSpeed` int,
	`power` int,
	`images` json,
	`mainImage` varchar(500),
	`description` text,
	`features` json,
	`vin` varchar(50),
	`registrationNumber` varchar(20),
	`isAvailable` boolean DEFAULT true,
	`isFeatured` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cars_id` PRIMARY KEY(`id`),
	CONSTRAINT `cars_firebaseId_unique` UNIQUE(`firebaseId`)
);
--> statement-breakpoint
CREATE TABLE `dealers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`firebaseId` varchar(128),
	`name` text NOT NULL,
	`description` text,
	`address` text,
	`city` varchar(100),
	`postcode` varchar(20),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`phone` varchar(20),
	`email` varchar(320),
	`whatsappNumber` varchar(20),
	`website` varchar(500),
	`logoUrl` varchar(500),
	`rating` decimal(3,2),
	`isVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `financeApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carId` int,
	`status` enum('draft','submitted','approved','rejected') DEFAULT 'draft',
	`loanAmount` decimal(10,2),
	`depositAmount` decimal(10,2),
	`term` int,
	`monthlyPayment` decimal(10,2),
	`applicantData` json,
	`externalApplicationId` varchar(100),
	`responseData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `financeApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`carId` int NOT NULL,
	`dealerId` int,
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`reservationDate` timestamp NOT NULL,
	`viewingDate` timestamp,
	`userName` varchar(255),
	`userEmail` varchar(320),
	`userPhone` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255),
	`searchParams` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','dealer') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `accountType` enum('individual','business') DEFAULT 'individual';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `cars` ADD CONSTRAINT `cars_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financeApplications` ADD CONSTRAINT `financeApplications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `financeApplications` ADD CONSTRAINT `financeApplications_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `savedSearches` ADD CONSTRAINT `savedSearches_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;