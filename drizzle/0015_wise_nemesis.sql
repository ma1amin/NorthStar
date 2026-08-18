CREATE INDEX `cre_submission_idx` ON `curation_register_entries` (`submissionId`);--> statement-breakpoint
ALTER TABLE `curation_register_entries` DROP INDEX `curation_register_entries_submission_uq`;--> statement-breakpoint
ALTER TABLE `curation_register_entries` MODIFY COLUMN `submissionId` int;--> statement-breakpoint
ALTER TABLE `curation_register_entries` ADD `candidateUrl` varchar(2048);--> statement-breakpoint
UPDATE `curation_register_entries` AS entry JOIN `submissions` AS submission ON submission.id = entry.submissionId SET entry.candidateUrl = submission.url;--> statement-breakpoint
ALTER TABLE `curation_register_entries` MODIFY COLUMN `candidateUrl` varchar(2048) NOT NULL;--> statement-breakpoint
ALTER TABLE `curation_register_entries` ADD CONSTRAINT `curation_register_entries_candidate_url_uq` UNIQUE(`candidateUrl`);
