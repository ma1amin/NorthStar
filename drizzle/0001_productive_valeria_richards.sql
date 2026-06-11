CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(255) NOT NULL,
	`entityId` int NOT NULL,
	`changes` json,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_resource_uq` UNIQUE(`userId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`icon` varchar(255),
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_name_unique` UNIQUE(`name`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `collection_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`resourceId` int NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collection_resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `collection_resource_uq` UNIQUE(`collectionId`,`resourceId`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`upvotes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `collections_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_slug_uq` UNIQUE(`ownerId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`type` enum('alternative_to','similar_to','integrates_with','built_by','depends_on','part_of','competitor_of') NOT NULL,
	`strength` decimal(3,2) NOT NULL DEFAULT '0.50',
	`verified` boolean NOT NULL DEFAULT false,
	`upvotes` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`status` enum('approved','pending','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relationships_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_target_type_uq` UNIQUE(`sourceId`,`targetId`,`type`)
);
--> statement-breakpoint
CREATE TABLE `resource_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resource_tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `resource_tag_uq` UNIQUE(`resourceId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`url` varchar(2048) NOT NULL,
	`categoryId` int NOT NULL,
	`subcategoryId` int,
	`logo` text,
	`pricing` enum('free','freemium','paid','open_source','enterprise') NOT NULL,
	`license` varchar(255),
	`builtBy` varchar(255),
	`builtByUrl` varchar(2048),
	`submittedBy` int NOT NULL,
	`status` enum('approved','pending','rejected') NOT NULL DEFAULT 'pending',
	`upvotes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`approvedAt` timestamp,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `resources_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subcategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subcategories_id` PRIMARY KEY(`id`),
	CONSTRAINT `category_slug_uq` UNIQUE(`categoryId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submittedBy` int NOT NULL,
	`resourceId` int,
	`title` varchar(255) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`description` text,
	`categoryId` int NOT NULL,
	`subcategoryId` int,
	`tags` json,
	`pricing` enum('free','freemium','paid','open_source','enterprise') NOT NULL,
	`license` varchar(255),
	`builtBy` varchar(255),
	`builtByUrl` varchar(2048),
	`suggestedRelationships` json,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`reviewedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`reviewedAt` timestamp,
	CONSTRAINT `submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tags_name_unique` UNIQUE(`name`),
	CONSTRAINT `tags_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`resourceId` int,
	`relationshipId` int,
	`type` enum('upvote','downvote') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `votes_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_resource_uq` UNIQUE(`userId`,`resourceId`),
	CONSTRAINT `user_relationship_uq` UNIQUE(`userId`,`relationshipId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','moderator','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `reputation` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `openId_idx` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_resources` ADD CONSTRAINT `collection_resources_collectionId_collections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_resources` ADD CONSTRAINT `collection_resources_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collections` ADD CONSTRAINT `collections_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_sourceId_resources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_targetId_resources_id_fk` FOREIGN KEY (`targetId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_tags` ADD CONSTRAINT `resource_tags_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_tags` ADD CONSTRAINT `resource_tags_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resources` ADD CONSTRAINT `resources_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resources` ADD CONSTRAINT `resources_subcategoryId_subcategories_id_fk` FOREIGN KEY (`subcategoryId`) REFERENCES `subcategories`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resources` ADD CONSTRAINT `resources_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subcategories` ADD CONSTRAINT `subcategories_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_submittedBy_users_id_fk` FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `votes` ADD CONSTRAINT `votes_relationshipId_relationships_id_fk` FOREIGN KEY (`relationshipId`) REFERENCES `relationships`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `audit_logs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `audit_logs` (`action`);--> statement-breakpoint
CREATE INDEX `entityType_idx` ON `audit_logs` (`entityType`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `bookmarks` (`userId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `bookmarks` (`resourceId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `collectionId_idx` ON `collection_resources` (`collectionId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `collection_resources` (`resourceId`);--> statement-breakpoint
CREATE INDEX `ownerId_idx` ON `collections` (`ownerId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `sourceId_idx` ON `relationships` (`sourceId`);--> statement-breakpoint
CREATE INDEX `targetId_idx` ON `relationships` (`targetId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `relationships` (`type`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `relationships` (`status`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `resource_tags` (`resourceId`);--> statement-breakpoint
CREATE INDEX `tagId_idx` ON `resource_tags` (`tagId`);--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `resources` (`categoryId`);--> statement-breakpoint
CREATE INDEX `subcategoryId_idx` ON `resources` (`subcategoryId`);--> statement-breakpoint
CREATE INDEX `submittedBy_idx` ON `resources` (`submittedBy`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `resources` (`status`);--> statement-breakpoint
CREATE INDEX `categoryId_idx` ON `subcategories` (`categoryId`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `subcategories` (`slug`);--> statement-breakpoint
CREATE INDEX `submittedBy_idx` ON `submissions` (`submittedBy`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `submissions` (`resourceId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `submissions` (`status`);--> statement-breakpoint
CREATE INDEX `slug_idx` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `votes` (`userId`);--> statement-breakpoint
CREATE INDEX `resourceId_idx` ON `votes` (`resourceId`);--> statement-breakpoint
CREATE INDEX `relationshipId_idx` ON `votes` (`relationshipId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `users` (`email`);