ALTER TABLE `reports` ADD `ai_status` text(20) DEFAULT 'pending' NOT NULL;
ALTER TABLE `reports` ADD `ai_likely_abuse` integer;
ALTER TABLE `reports` ADD `ai_category` text(20);
ALTER TABLE `reports` ADD `ai_severity` integer;
ALTER TABLE `reports` ADD `ai_confidence` integer;
ALTER TABLE `reports` ADD `ai_checked_at` integer;
ALTER TABLE `reports` ADD `ai_error` text(255);
