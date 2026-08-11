CREATE TABLE `search_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`query` varchar(255) NOT NULL,
	`normalizedQuery` varchar(255) NOT NULL,
	`resultCount` int NOT NULL,
	`relationshipIntent` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `search_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `search_analytics_normalized_query_idx` ON `search_analytics` (`normalizedQuery`);--> statement-breakpoint
CREATE INDEX `search_analytics_created_at_idx` ON `search_analytics` (`createdAt`);