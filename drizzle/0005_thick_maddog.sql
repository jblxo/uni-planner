DROP INDEX `courses_name_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `courses_user_name_unique` ON `courses` (`user_id`,`name`);--> statement-breakpoint
CREATE INDEX `courses_user_idx` ON `courses` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);