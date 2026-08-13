CREATE TABLE `contributor_appeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetType` enum('verification','intake_candidate','submission','account_action') NOT NULL,
	`targetId` int NOT NULL,
	`rationale` text NOT NULL,
	`status` enum('open','upheld','overturned','withdrawn') NOT NULL DEFAULT 'open',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `contributor_appeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contributor_verification_applications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`portfolioUrl` varchar(2048),
	`rationale` text NOT NULL,
	`status` enum('pending','approved','rejected','suspended') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `contributor_verification_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intake_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`intakeId` int NOT NULL,
	`candidateType` enum('resource','source','relationship') NOT NULL,
	`title` varchar(255),
	`url` varchar(2048),
	`description` text,
	`sourceContext` varchar(500),
	`extractionMetadata` json,
	`confidence` decimal(3,2),
	`status` enum('draft','submitted','accepted','rejected','duplicate') NOT NULL DEFAULT 'draft',
	`submissionId` int,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `intake_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_intakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`inputType` enum('pasted_text','links','text_export') NOT NULL,
	`inputName` varchar(255),
	`storageKey` varchar(512),
	`retentionMode` enum('minimized','review_evidence') NOT NULL DEFAULT 'minimized',
	`consentConfirmed` boolean NOT NULL DEFAULT false,
	`status` enum('draft','processing','ready_for_review','submitted','closed') NOT NULL DEFAULT 'draft',
	`candidateCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `resource_intakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `contributor_appeals` ADD CONSTRAINT `contributor_appeals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contributor_appeals` ADD CONSTRAINT `contributor_appeals_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contributor_verification_applications` ADD CONSTRAINT `contributor_verification_applications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contributor_verification_applications` ADD CONSTRAINT `contributor_verification_applications_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_candidates` ADD CONSTRAINT `intake_candidates_intakeId_resource_intakes_id_fk` FOREIGN KEY (`intakeId`) REFERENCES `resource_intakes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_candidates` ADD CONSTRAINT `intake_candidates_submissionId_submissions_id_fk` FOREIGN KEY (`submissionId`) REFERENCES `submissions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `intake_candidates` ADD CONSTRAINT `intake_candidates_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_intakes` ADD CONSTRAINT `resource_intakes_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `contrib_appeal_user_status_idx` ON `contributor_appeals` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `contrib_appeal_target_idx` ON `contributor_appeals` (`targetType`,`targetId`);--> statement-breakpoint
CREATE INDEX `contrib_appeal_status_created_idx` ON `contributor_appeals` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `contrib_verify_user_status_idx` ON `contributor_verification_applications` (`userId`,`status`);--> statement-breakpoint
CREATE INDEX `contrib_verify_status_created_idx` ON `contributor_verification_applications` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `intake_candidate_status_idx` ON `intake_candidates` (`intakeId`,`status`);--> statement-breakpoint
CREATE INDEX `intake_candidate_created_idx` ON `intake_candidates` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `intake_candidate_url_idx` ON `intake_candidates` (`url`);--> statement-breakpoint
CREATE INDEX `intake_owner_status_idx` ON `resource_intakes` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `intake_status_created_idx` ON `resource_intakes` (`status`,`createdAt`);