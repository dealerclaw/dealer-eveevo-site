CREATE TABLE `dealerEnquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carId` int NOT NULL,
	`senderDealerId` int NOT NULL,
	`receiverDealerId` int NOT NULL,
	`message` text NOT NULL,
	`offerPrice` decimal(10,2),
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`isReadByReceiver` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dealerEnquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealerEnquiryReplies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`enquiryId` int NOT NULL,
	`senderDealerId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealerEnquiryReplies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dealerEnquiries` ADD CONSTRAINT `dealerEnquiries_carId_cars_id_fk` FOREIGN KEY (`carId`) REFERENCES `cars`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerEnquiries` ADD CONSTRAINT `dealerEnquiries_senderDealerId_dealers_id_fk` FOREIGN KEY (`senderDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerEnquiries` ADD CONSTRAINT `dealerEnquiries_receiverDealerId_dealers_id_fk` FOREIGN KEY (`receiverDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerEnquiryReplies` ADD CONSTRAINT `dealerEnquiryReplies_enquiryId_dealerEnquiries_id_fk` FOREIGN KEY (`enquiryId`) REFERENCES `dealerEnquiries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dealerEnquiryReplies` ADD CONSTRAINT `dealerEnquiryReplies_senderDealerId_dealers_id_fk` FOREIGN KEY (`senderDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;