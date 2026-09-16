CREATE TABLE `globalStats` (
  `id` integer PRIMARY KEY NOT NULL,
  `data` text NOT NULL,
  `updated_at` integer DEFAULT (STRFTIME('%s')) NOT NULL
);
