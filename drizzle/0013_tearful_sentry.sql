ALTER TABLE `submissions` ADD `sourceUrl` varchar(2048);--> statement-breakpoint
ALTER TABLE `submissions` ADD `sourceType` enum('official','documentation','repository','community','archive','other');