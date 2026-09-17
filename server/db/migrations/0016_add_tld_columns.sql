ALTER TABLE `urls` ADD `tld` text(255) NOT NULL DEFAULT 'sh0rt.kr';
DROP INDEX `urls_uid_unique`;
CREATE UNIQUE INDEX `urls_tld_uid_unique` ON `urls` (`tld`, `uid`);
ALTER TABLE `analyticsCache` ADD `tld` text(255) NOT NULL DEFAULT 'sh0rt.kr';
DROP INDEX `analytics_cache_uid_unique`;
CREATE UNIQUE INDEX `analytics_cache_tld_uid_unique` ON `analyticsCache` (`tld`, `uid`);
ALTER TABLE `reports` ADD `tld` text(255);
CREATE INDEX `reports_tld_idx` ON `reports` (`tld`);
