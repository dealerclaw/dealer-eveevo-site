CREATE TABLE `evFaultRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`faultId` int NOT NULL,
	`dealerId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evFaultRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evFaultViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`faultId` int NOT NULL,
	`dealerId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evFaultViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `evFaultRatings` ADD CONSTRAINT `evFaultRatings_faultId_evFaults_id_fk` FOREIGN KEY (`faultId`) REFERENCES `evFaults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultRatings` ADD CONSTRAINT `evFaultRatings_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultViews` ADD CONSTRAINT `evFaultViews_faultId_evFaults_id_fk` FOREIGN KEY (`faultId`) REFERENCES `evFaults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultViews` ADD CONSTRAINT `evFaultViews_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;