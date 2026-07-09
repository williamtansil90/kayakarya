-- Homepage settings table
USE `kayakarya_course`;

CREATE TABLE IF NOT EXISTS `homepage_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tagline` VARCHAR(255) DEFAULT 'Belajar Kreatif, Raih Karya',
  `title` VARCHAR(255) DEFAULT 'Temukan Course Kreatif Terbaik',
  `subtitle` TEXT,
  `cta_text` VARCHAR(255) DEFAULT 'Mulai dengan Google Account',
  `wallpaper_url` VARCHAR(500) DEFAULT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `homepage_settings` (`id`, `tagline`, `title`, `subtitle`, `cta_text`)
VALUES (
  1,
  'Belajar Kreatif, Raih Karya',
  'Temukan Course Kreatif Terbaik',
  'Belajar langsung dari para ahli. Dari desain, ilustrasi, hingga fotografi.',
  'Mulai dengan Google Account'
);

UPDATE `users` SET `role` = 'admin' WHERE `email` = 'william.tansil.90@gmail.com';
