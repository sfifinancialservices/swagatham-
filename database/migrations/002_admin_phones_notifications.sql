-- Run after initial schema: mysql -u root -p swagatham_foundation < database/migrations/002_admin_phones_notifications.sql

USE swagatham_foundation;

CREATE TABLE IF NOT EXISTS admin_phones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  label VARCHAR(128) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO admin_phones (phone, label) VALUES ('9789146620', 'Default admin');

-- user_id matches legacy DBs where users.id is signed INT (not UNSIGNED).
-- No FK: avoids type mismatch between signed/unsigned across installs.
CREATE TABLE IF NOT EXISTS user_notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_unread (user_id, read_at)
) ENGINE=InnoDB;
