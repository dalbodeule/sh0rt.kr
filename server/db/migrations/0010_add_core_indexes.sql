CREATE UNIQUE INDEX IF NOT EXISTS `users_vendor_token_unique` ON `users` (`vendor`, `token`);
CREATE UNIQUE INDEX IF NOT EXISTS `urls_uid_unique` ON `urls` (`uid`);
CREATE INDEX IF NOT EXISTS `urls_expires_idx` ON `urls` (`expires`);
CREATE UNIQUE INDEX IF NOT EXISTS `user_to_urls_unique` ON `userToUrls` (`user`, `url`);
CREATE INDEX IF NOT EXISTS `user_to_urls_user_idx` ON `userToUrls` (`user`);
CREATE UNIQUE INDEX IF NOT EXISTS `analytics_cache_uid_unique` ON `analyticsCache` (`uid`);
