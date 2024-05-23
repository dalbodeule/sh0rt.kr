CREATE TABLE `urls` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uid` text(10) NOT NULL,
	`forward` text(4096) NOT NULL,
	`user` integer,
	`created_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`updated_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`expires` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text(255) NOT NULL,
	`vendor` text(20) NOT NULL,
	`name` text(20) NOT NULL,
	`token` text(255) NOT NULL,
	`profile` text(4096) NOT NULL,
	`created_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`updated_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`login_limit` integer,
	`role` integer DEFAULT 0 NOT NULL
);
