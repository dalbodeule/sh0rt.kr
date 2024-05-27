CREATE TABLE `analyticsCache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`data` text NOT NULL,
	`created_at` integer DEFAULT (STRFTIME('%s'))
);
