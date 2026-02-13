ALTER TABLE `dealers` ADD `referralCode` varchar(20);--> statement-breakpoint
ALTER TABLE `dealers` ADD `referredBy` int;--> statement-breakpoint
ALTER TABLE `dealers` ADD `referralCredits` decimal(10,2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_referralCode_unique` UNIQUE(`referralCode`);--> statement-breakpoint
ALTER TABLE `dealers` ADD CONSTRAINT `dealers_referredBy_dealers_id_fk` FOREIGN KEY (`referredBy`) REFERENCES `dealers`(`id`) ON DELETE no action ON UPDATE no action;