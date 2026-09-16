CREATE TABLE `reports` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `url_id` integer,
  `uid` text(20),
  `forward` text(4096),
  `reporter_email` text(255),
  `reason` text(50) NOT NULL,
  `details` text(5000) DEFAULT '' NOT NULL,
  `source` text(10) DEFAULT 'web' NOT NULL,
  `sender` text(255),
  `subject` text(500),
  `body_text` text(20000),
  `status` text(20) DEFAULT 'open' NOT NULL,
  `created_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
  `updated_at` integer DEFAULT (STRFTIME('%s')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);
--> statement-breakpoint
CREATE INDEX `reports_uid_idx` ON `reports` (`uid`);
--> statement-breakpoint
CREATE INDEX `reports_created_at_idx` ON `reports` (`created_at`);
--> statement-breakpoint
CREATE INDEX `reports_url_id_idx` ON `reports` (`url_id`);
