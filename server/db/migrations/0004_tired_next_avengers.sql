CREATE TABLE `records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`domain` integer,
	`type` text(8) NOT NULL,
	`name` text(255) NOT NULL,
	`value` text(1024) NOT NULL,
	FOREIGN KEY (`domain`) REFERENCES `domains`(`id`) ON UPDATE no action ON DELETE no action
);
