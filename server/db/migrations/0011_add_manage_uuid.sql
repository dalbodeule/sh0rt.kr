ALTER TABLE `urls` ADD COLUMN `manage_id` text NOT NULL DEFAULT '';

UPDATE `urls`
SET `manage_id` = lower(hex(randomblob(4))) || '-' ||
                  lower(hex(randomblob(2))) || '-4' ||
                  substr(lower(hex(randomblob(2))), 2) || '-' ||
                  substr('89ab', abs(random()) % 4 + 1, 1) ||
                  substr(lower(hex(randomblob(2))), 2) || '-' ||
                  lower(hex(randomblob(6)))
WHERE `manage_id` = '';

CREATE UNIQUE INDEX `urls_manage_id_unique` ON `urls` (`manage_id`);
