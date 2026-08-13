CREATE TABLE `api_key_daily_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`usageDay` varchar(10) NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_key_daily_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_key_day_uq` UNIQUE(`apiKeyId`,`usageDay`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`keyPrefix` varchar(24) NOT NULL,
	`keyHash` varchar(64) NOT NULL,
	`scopes` json NOT NULL,
	`dailyQuota` int NOT NULL DEFAULT 1000,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_key_hash_uq` UNIQUE(`keyHash`)
);
--> statement-breakpoint
ALTER TABLE `api_key_daily_usage` ADD CONSTRAINT `api_key_daily_usage_apiKeyId_api_keys_id_fk` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `api_key_day_idx` ON `api_key_daily_usage` (`apiKeyId`,`usageDay`);--> statement-breakpoint
CREATE INDEX `api_key_owner_status_idx` ON `api_keys` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `api_key_prefix_idx` ON `api_keys` (`keyPrefix`);