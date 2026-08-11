CREATE TABLE `resource_edit_suggestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`suggestedBy` int NOT NULL,
	`changes` json NOT NULL,
	`note` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `resource_edit_suggestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `relationships` ADD `evidenceUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `relationships` ADD `rationale` text;--> statement-breakpoint
ALTER TABLE `relationships` ADD `sourceContext` varchar(255);--> statement-breakpoint
ALTER TABLE `resource_edit_suggestions` ADD CONSTRAINT `resource_edit_suggestions_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_edit_suggestions` ADD CONSTRAINT `resource_edit_suggestions_suggestedBy_users_id_fk` FOREIGN KEY (`suggestedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_edit_suggestions` ADD CONSTRAINT `resource_edit_suggestions_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `resource_edit_suggestions_resource_status_idx` ON `resource_edit_suggestions` (`resourceId`,`status`);--> statement-breakpoint
CREATE INDEX `resource_edit_suggestions_suggested_by_idx` ON `resource_edit_suggestions` (`suggestedBy`);--> statement-breakpoint
CREATE INDEX `resource_edit_suggestions_status_created_idx` ON `resource_edit_suggestions` (`status`,`createdAt`);