CREATE TABLE `users` (
	`did` text PRIMARY KEY NOT NULL,
	`name` text,
	`avatar` text,
	`socials` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_users_created_at` ON `users` (`created_at`);