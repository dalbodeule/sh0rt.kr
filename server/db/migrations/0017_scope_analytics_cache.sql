ALTER TABLE `analyticsCache` ADD `manage_id` text(36);
DROP INDEX `analytics_cache_tld_uid_unique`;
CREATE UNIQUE INDEX `analytics_cache_manage_id_unique` ON `analyticsCache` (`manage_id`);
