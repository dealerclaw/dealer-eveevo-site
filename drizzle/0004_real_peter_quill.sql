ALTER TABLE `cars` ADD `marketplace` enum('consumer','dealer_only') DEFAULT 'consumer';--> statement-breakpoint
ALTER TABLE `dealers` ADD `subscriptionStatus` enum('none','active','expired') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `dealers` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `dealers` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `dealers` ADD `stripeSubscriptionId` varchar(255);