CREATE TABLE `trusted_source_domains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`domain` varchar(255) NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`mode` enum('advisory') NOT NULL DEFAULT 'advisory',
	`note` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trusted_source_domains_id` PRIMARY KEY(`id`),
	CONSTRAINT `trusted_source_domains_domain_uq` UNIQUE(`domain`)
);
--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD `registrableDomain` varchar(255);--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD `retryCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `archive_import_candidates` ADD `lastRetryAt` timestamp;--> statement-breakpoint
CREATE INDEX `trusted_source_domains_status_idx` ON `trusted_source_domains` (`status`);--> statement-breakpoint
CREATE INDEX `archive_import_candidates_batch_domain_idx` ON `archive_import_candidates` (`batchId`,`registrableDomain`);