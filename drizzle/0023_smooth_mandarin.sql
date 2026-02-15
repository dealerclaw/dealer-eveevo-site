CREATE TABLE `evFaultContributions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`faultId` int NOT NULL,
	`dealerId` int NOT NULL,
	`contributionType` enum('additional_solution','cost_update','symptom_clarification','alternative_fix','parts_recommendation') NOT NULL,
	`content` text NOT NULL,
	`actualCost` decimal(10,2),
	`actualLaborHours` decimal(5,2),
	`partsUsed` json,
	`isVerified` boolean DEFAULT false,
	`helpfulCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evFaultContributions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evFaultHelpful` (
	`id` int AUTO_INCREMENT NOT NULL,
	`faultId` int NOT NULL,
	`dealerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evFaultHelpful_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evFaults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`make` varchar(100) NOT NULL,
	`model` varchar(100) NOT NULL,
	`yearFrom` int,
	`yearTo` int,
	`problemTitle` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`symptoms` text NOT NULL,
	`resolution` text NOT NULL,
	`category` enum('battery','charging','motor_drivetrain','brakes','suspension','electrical','infotainment','hvac','body_trim','safety_systems','software','other') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`frequency` enum('rare','occasional','common','very_common') NOT NULL,
	`estimatedCostMin` decimal(10,2),
	`estimatedCostMax` decimal(10,2),
	`laborHours` decimal(5,2),
	`sourceType` enum('research','dealer_contributed','recall','tsb') NOT NULL DEFAULT 'research',
	`contributedByDealerId` int,
	`recallNumber` varchar(100),
	`tsbNumber` varchar(100),
	`isVerified` boolean DEFAULT false,
	`viewCount` int DEFAULT 0,
	`helpfulCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evFaults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `evFaultContributions` ADD CONSTRAINT `evFaultContributions_faultId_evFaults_id_fk` FOREIGN KEY (`faultId`) REFERENCES `evFaults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultContributions` ADD CONSTRAINT `evFaultContributions_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultHelpful` ADD CONSTRAINT `evFaultHelpful_faultId_evFaults_id_fk` FOREIGN KEY (`faultId`) REFERENCES `evFaults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaultHelpful` ADD CONSTRAINT `evFaultHelpful_dealerId_dealers_id_fk` FOREIGN KEY (`dealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evFaults` ADD CONSTRAINT `evFaults_contributedByDealerId_dealers_id_fk` FOREIGN KEY (`contributedByDealerId`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;