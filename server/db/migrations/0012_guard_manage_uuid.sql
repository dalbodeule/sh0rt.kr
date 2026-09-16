CREATE TRIGGER `urls_manage_id_insert_guard`
BEFORE INSERT ON `urls`
WHEN NEW.`manage_id` IS NULL OR length(NEW.`manage_id`) != 36
BEGIN
    SELECT RAISE(ABORT, 'manage_id must be a UUID');
END;

CREATE TRIGGER `urls_manage_id_update_guard`
BEFORE UPDATE OF `manage_id` ON `urls`
WHEN NEW.`manage_id` IS NULL OR length(NEW.`manage_id`) != 36
BEGIN
    SELECT RAISE(ABORT, 'manage_id must be a UUID');
END;
