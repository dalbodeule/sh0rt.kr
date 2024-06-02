CREATE TABLE `domains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain` text(20) NOT NULL,
	`created_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`updated_at` integer DEFAULT (STRFTIME('%s')) NOT NULL,
	`expires` integer DEFAULT (STRFTIME('%s')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usersToDomains` (
	`user` integer NOT NULL,
	`domain` integer NOT NULL,
	FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`domain`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE no action
);
