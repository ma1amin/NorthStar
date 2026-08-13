CREATE TABLE `search_evaluation_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(255) NOT NULL,
	`expectedResourceIds` json NOT NULL,
	`notes` text,
	`status` enum('draft','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `search_evaluation_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `search_analytics` ADD `eventType` enum('search','result_click') DEFAULT 'search' NOT NULL;--> statement-breakpoint
ALTER TABLE `search_analytics` ADD `latencyMs` int;--> statement-breakpoint
ALTER TABLE `search_analytics` ADD `clickedResourceId` int;--> statement-breakpoint
ALTER TABLE `search_analytics` ADD `hadPreviousQuery` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `search_evaluation_cases` ADD CONSTRAINT `search_evaluation_cases_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `search_evaluation_cases` ADD CONSTRAINT `search_evaluation_cases_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `search_eval_status_created_idx` ON `search_evaluation_cases` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `search_analytics_event_created_idx` ON `search_analytics` (`eventType`,`createdAt`);