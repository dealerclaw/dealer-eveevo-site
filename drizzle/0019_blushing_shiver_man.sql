ALTER TABLE `dealerBids` ADD `paymentStatus` enum('pending','paid','failed') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `dealerBids` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `dealerBids` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `dealerBids` ADD `inspectionScheduledAt` timestamp;--> statement-breakpoint
ALTER TABLE `dealerBids` ADD `inspectionNotes` text;