CREATE TABLE `urlBlacklist` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `uid` text(20) NOT NULL,
  `reason` text(500) DEFAULT '' NOT NULL,
  `created_by` integer NOT NULL REFERENCES `users`(`id`),
  `created_at` integer DEFAULT (STRFTIME('%s')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `url_blacklist_uid_unique` ON `urlBlacklist` (`uid`);
--> statement-breakpoint
CREATE INDEX `url_blacklist_created_at_idx` ON `urlBlacklist` (`created_at`);
