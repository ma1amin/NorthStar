CREATE TABLE `resource_duplicate_resolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`duplicateResourceId` int NOT NULL,
	`canonicalResourceId` int NOT NULL,
	`status` enum('proposed','confirmed','cancelled') NOT NULL DEFAULT 'proposed',
	`rationale` text NOT NULL,
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `resource_duplicate_resolutions_id` PRIMARY KEY(`id`),
	CONSTRAINT `resource_duplicate_pair_idx` UNIQUE(`duplicateResourceId`,`canonicalResourceId`)
);
--> statement-breakpoint
CREATE TABLE `resource_freshness_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`status` enum('current','needs_review','stale') NOT NULL,
	`note` text,
	`checkedBy` int NOT NULL,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_freshness_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`eventType` enum('resource_created','metadata_updated','source_verified','freshness_checked','duplicate_resolution_proposed','duplicate_resolution_confirmed') NOT NULL,
	`summary` varchar(500) NOT NULL,
	`changes` json,
	`isPublic` boolean NOT NULL DEFAULT true,
	`recordedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`url` varchar(2048) NOT NULL,
	`sourceType` enum('official','documentation','repository','community','archive','other') NOT NULL,
	`attribution` varchar(500),
	`licenseNote` varchar(500),
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	`verificationStatus` enum('pending','approved','rejected','superseded') NOT NULL DEFAULT 'pending',
	`addedBy` int NOT NULL,
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resources` ADD `canonicalResourceId` int;--> statement-breakpoint
ALTER TABLE `resource_duplicate_resolutions` ADD CONSTRAINT `res_dup_dup_fk` FOREIGN KEY (`duplicateResourceId`) REFERENCES `resources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_duplicate_resolutions` ADD CONSTRAINT `res_dup_can_fk` FOREIGN KEY (`canonicalResourceId`) REFERENCES `resources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_duplicate_resolutions` ADD CONSTRAINT `res_dup_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_duplicate_resolutions` ADD CONSTRAINT `res_dup_reviewer_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_freshness_reviews` ADD CONSTRAINT `resource_freshness_reviews_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_freshness_reviews` ADD CONSTRAINT `resource_freshness_reviews_checkedBy_users_id_fk` FOREIGN KEY (`checkedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_history` ADD CONSTRAINT `resource_history_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_history` ADD CONSTRAINT `resource_history_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_sources` ADD CONSTRAINT `resource_sources_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_sources` ADD CONSTRAINT `resource_sources_addedBy_users_id_fk` FOREIGN KEY (`addedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_sources` ADD CONSTRAINT `resource_sources_verifiedBy_users_id_fk` FOREIGN KEY (`verifiedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `resource_duplicate_duplicate_status_idx` ON `resource_duplicate_resolutions` (`duplicateResourceId`,`status`);--> statement-breakpoint
CREATE INDEX `resource_duplicate_canonical_status_idx` ON `resource_duplicate_resolutions` (`canonicalResourceId`,`status`);--> statement-breakpoint
CREATE INDEX `resource_freshness_resource_checked_idx` ON `resource_freshness_reviews` (`resourceId`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `resource_freshness_status_checked_idx` ON `resource_freshness_reviews` (`status`,`checkedAt`);--> statement-breakpoint
CREATE INDEX `resource_history_resource_created_idx` ON `resource_history` (`resourceId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `resource_history_public_idx` ON `resource_history` (`resourceId`,`isPublic`);--> statement-breakpoint
CREATE INDEX `resource_sources_resource_status_idx` ON `resource_sources` (`resourceId`,`verificationStatus`);--> statement-breakpoint
CREATE INDEX `resource_sources_url_idx` ON `resource_sources` (`url`);--> statement-breakpoint
ALTER TABLE `resources` ADD CONSTRAINT `resources_canonicalResourceId_resources_id_fk` FOREIGN KEY (`canonicalResourceId`) REFERENCES `resources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `canonicalResource_idx` ON `resources` (`canonicalResourceId`);
