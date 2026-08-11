CREATE TABLE `resource_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`reporterId` int NOT NULL,
	`reason` enum('spam','duplicate','inaccurate','malicious','other') NOT NULL,
	`details` text,
	`status` enum('open','resolved','dismissed') NOT NULL DEFAULT 'open',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `resource_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resource_reports` ADD CONSTRAINT `resource_reports_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_reports` ADD CONSTRAINT `resource_reports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_reports` ADD CONSTRAINT `resource_reports_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `resource_reports_resource_status_idx` ON `resource_reports` (`resourceId`,`status`);--> statement-breakpoint
CREATE INDEX `resource_reports_reporter_idx` ON `resource_reports` (`reporterId`);--> statement-breakpoint
CREATE INDEX `resource_reports_status_created_idx` ON `resource_reports` (`status`,`createdAt`);