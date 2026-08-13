CREATE TABLE `api_capacity_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`requestedDailyQuota` int NOT NULL,
	`rationale` text NOT NULL,
	`status` enum('pending','approved','rejected','expired','revoked') NOT NULL DEFAULT 'pending',
	`grantedDailyQuota` int,
	`expiresAt` timestamp,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `api_capacity_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `graph_projection_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`providerId` enum('neo4j','arangodb') NOT NULL,
	`requestedBy` int,
	`status` enum('queued','running','completed','failed','disabled') NOT NULL DEFAULT 'queued',
	`resourceCount` int NOT NULL DEFAULT 0,
	`relationshipCount` int NOT NULL DEFAULT 0,
	`errorCode` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `graph_projection_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_batches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`status` enum('queued','processing','ready_for_review','stopped','failed','closed') NOT NULL DEFAULT 'queued',
	`candidateCount` int NOT NULL DEFAULT 0,
	`stopReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `ingestion_batches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchId` int NOT NULL,
	`externalUrl` varchar(2048) NOT NULL,
	`contentHash` varchar(64) NOT NULL,
	`title` varchar(255),
	`summary` text,
	`attribution` varchar(500),
	`licenseNote` varchar(500),
	`assessment` json,
	`status` enum('pending','accepted','duplicate','rejected') NOT NULL DEFAULT 'pending',
	`duplicateResourceId` int,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `ingestion_candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingestion_candidate_batch_url_uq` UNIQUE(`batchId`,`externalUrl`)
);
--> statement-breakpoint
CREATE TABLE `ingestion_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`baseUrl` varchar(2048) NOT NULL,
	`termsUrl` varchar(2048),
	`sourceType` enum('official_site','official_docs','official_repository','manual_feed') NOT NULL,
	`status` enum('draft','approved','paused','retired') NOT NULL DEFAULT 'draft',
	`createdBy` int NOT NULL,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `ingestion_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `ingestion_source_url_uq` UNIQUE(`baseUrl`)
);
--> statement-breakpoint
CREATE TABLE `organization_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`applicantId` int NOT NULL,
	`organizationName` varchar(255) NOT NULL,
	`websiteUrl` varchar(2048) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`evidenceUrl` varchar(2048),
	`resourceId` int,
	`rationale` text NOT NULL,
	`status` enum('pending','approved','rejected','suspended','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`reviewedBy` int,
	`reviewNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	CONSTRAINT `organization_claims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `research_workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `research_workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_owner_slug_uq` UNIQUE(`ownerId`,`slug`)
);
--> statement-breakpoint
CREATE TABLE `semantic_index_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`indexVersion` varchar(64) NOT NULL,
	`documentHash` varchar(64) NOT NULL,
	`status` enum('queued','indexed','skipped','failed') NOT NULL DEFAULT 'queued',
	`providerId` varchar(64),
	`errorCode` varchar(120),
	`requestedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	CONSTRAINT `semantic_index_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `semantic_resource_version_uq` UNIQUE(`resourceId`,`indexVersion`)
);
--> statement-breakpoint
CREATE TABLE `workspace_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`resourceId` int NOT NULL,
	`note` varchar(1200),
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_resources_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_resource_uq` UNIQUE(`workspaceId`,`resourceId`)
);
--> statement-breakpoint
ALTER TABLE `api_capacity_requests` ADD CONSTRAINT `api_capacity_requests_apiKeyId_api_keys_id_fk` FOREIGN KEY (`apiKeyId`) REFERENCES `api_keys`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_capacity_requests` ADD CONSTRAINT `api_capacity_requests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `api_capacity_requests` ADD CONSTRAINT `api_capacity_requests_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `graph_projection_runs` ADD CONSTRAINT `graph_projection_runs_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_batches` ADD CONSTRAINT `ingestion_batches_sourceId_ingestion_sources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `ingestion_sources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_batches` ADD CONSTRAINT `ingestion_batches_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_candidates` ADD CONSTRAINT `ingestion_candidates_batchId_ingestion_batches_id_fk` FOREIGN KEY (`batchId`) REFERENCES `ingestion_batches`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_candidates` ADD CONSTRAINT `ingestion_candidates_duplicateResourceId_resources_id_fk` FOREIGN KEY (`duplicateResourceId`) REFERENCES `resources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_candidates` ADD CONSTRAINT `ingestion_candidates_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_sources` ADD CONSTRAINT `ingestion_sources_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestion_sources` ADD CONSTRAINT `ingestion_sources_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_claims` ADD CONSTRAINT `organization_claims_applicantId_users_id_fk` FOREIGN KEY (`applicantId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_claims` ADD CONSTRAINT `organization_claims_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_claims` ADD CONSTRAINT `organization_claims_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `research_workspaces` ADD CONSTRAINT `research_workspaces_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semantic_index_jobs` ADD CONSTRAINT `semantic_index_jobs_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `semantic_index_jobs` ADD CONSTRAINT `semantic_index_jobs_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_resources` ADD CONSTRAINT `workspace_resources_workspaceId_research_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `research_workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_resources` ADD CONSTRAINT `workspace_resources_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `api_capacity_key_status_idx` ON `api_capacity_requests` (`apiKeyId`,`status`);--> statement-breakpoint
CREATE INDEX `api_capacity_requester_status_idx` ON `api_capacity_requests` (`requestedBy`,`status`);--> statement-breakpoint
CREATE INDEX `api_capacity_status_created_idx` ON `api_capacity_requests` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `graph_projection_provider_status_idx` ON `graph_projection_runs` (`providerId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ingestion_batch_source_status_idx` ON `ingestion_batches` (`sourceId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ingestion_batch_requested_by_idx` ON `ingestion_batches` (`requestedBy`);--> statement-breakpoint
CREATE INDEX `ingestion_candidate_batch_status_idx` ON `ingestion_candidates` (`batchId`,`status`);--> statement-breakpoint
CREATE INDEX `ingestion_candidate_status_created_idx` ON `ingestion_candidates` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ingestion_source_status_created_idx` ON `ingestion_sources` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `org_claim_applicant_status_idx` ON `organization_claims` (`applicantId`,`status`);--> statement-breakpoint
CREATE INDEX `org_claim_status_created_idx` ON `organization_claims` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workspace_owner_status_idx` ON `research_workspaces` (`ownerId`,`status`);--> statement-breakpoint
CREATE INDEX `semantic_status_created_idx` ON `semantic_index_jobs` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `workspace_resource_order_idx` ON `workspace_resources` (`workspaceId`,`order`);