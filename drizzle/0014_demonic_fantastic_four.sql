CREATE TABLE `archive_candidate_field_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`field` enum('title','description','canonical_url','official_source_url') NOT NULL,
	`currentValue` text,
	`proposedValue` text NOT NULL,
	`evidenceUrl` varchar(2048) NOT NULL,
	`extractionMethod` enum('public_page_metadata','canonical_redirect') NOT NULL,
	`state` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`retrievedAt` timestamp NOT NULL,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `archive_candidate_field_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `curation_register_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registerId` int NOT NULL,
	`submissionId` int NOT NULL,
	`sequence` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `curation_register_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `curation_register_entries_register_sequence_uq` UNIQUE(`registerId`,`sequence`),
	CONSTRAINT `curation_register_entries_submission_uq` UNIQUE(`submissionId`)
);
--> statement-breakpoint
CREATE TABLE `curation_registers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`label` varchar(160) NOT NULL,
	`targetSize` int NOT NULL,
	`status` enum('staged','reviewing','completed') NOT NULL DEFAULT 'staged',
	`evidenceStandard` varchar(160) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `curation_registers_id` PRIMARY KEY(`id`),
	CONSTRAINT `curation_registers_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `archive_candidate_field_reviews` ADD CONSTRAINT `acfr_candidate_fk` FOREIGN KEY (`candidateId`) REFERENCES `archive_import_candidates`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curation_register_entries` ADD CONSTRAINT `cre_register_fk` FOREIGN KEY (`registerId`) REFERENCES `curation_registers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `curation_register_entries` ADD CONSTRAINT `cre_submission_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `archive_candidate_field_reviews_candidate_state_idx` ON `archive_candidate_field_reviews` (`candidateId`,`state`);--> statement-breakpoint
CREATE INDEX `archive_candidate_field_reviews_candidate_field_idx` ON `archive_candidate_field_reviews` (`candidateId`,`field`);--> statement-breakpoint
CREATE INDEX `curation_registers_status_idx` ON `curation_registers` (`status`);
