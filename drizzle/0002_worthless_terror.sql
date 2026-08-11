CREATE TABLE `reputation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`points` int NOT NULL,
	`reason` varchar(120) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` int NOT NULL,
	`eventKey` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reputation_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `reputation_events_eventKey_unique` UNIQUE(`eventKey`)
);
--> statement-breakpoint
ALTER TABLE `reputation_events` ADD CONSTRAINT `reputation_events_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `reputation_user_idx` ON `reputation_events` (`userId`);--> statement-breakpoint
CREATE INDEX `reputation_reason_idx` ON `reputation_events` (`reason`);--> statement-breakpoint
CREATE INDEX `reputation_entity_idx` ON `reputation_events` (`entityType`,`entityId`);