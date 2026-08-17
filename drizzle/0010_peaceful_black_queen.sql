CREATE TABLE `archive_import_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('parsed','review_ready','completed','failed') NOT NULL DEFAULT 'parsed',
	`totalUrlMentions` int NOT NULL DEFAULT 0,
	`uniqueCandidates` int NOT NULL DEFAULT 0,
	`rejectedUrlMentions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `archive_import_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `archive_import_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`candidateHash` varchar(64) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`canonicalUrl` varchar(2048),
	`title` varchar(255),
	`description` text,
	`builtBy` varchar(255),
	`builtByUrl` varchar(2048),
	`suggestedPricing` enum('free','freemium','paid','open_source','enterprise'),
	`suggestedLicense` varchar(255),
	`suggestedTags` json,
	`officialSourceUrl` varchar(2048),
	`duplicateResourceId` int,
	`status` enum('review_ready','duplicate','excluded','submitted','failed') NOT NULL DEFAULT 'review_ready',
	`failureCode` varchar(96),
	`submissionId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archive_import_candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `archive_import_candidates_batch_hash_uq` UNIQUE(`batchId`,`candidateHash`)
);
--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD CONSTRAINT `archive_import_candidates_batchId_archive_import_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `archive_import_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD CONSTRAINT `archive_import_candidates_duplicateResourceId_resources_id_fk` FOREIGN KEY (`duplicateResourceId`) REFERENCES `resources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD CONSTRAINT `archive_import_candidates_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `archive_import_batches_status_created_idx` ON `archive_import_batches` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `archive_import_candidates_batch_status_idx` ON `archive_import_candidates` (`batchId`,`status`);--> statement-breakpoint
CREATE INDEX `archive_import_candidates_duplicate_resource_idx` ON `archive_import_candidates` (`duplicateResourceId`);