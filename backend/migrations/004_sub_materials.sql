USE `kayakarya_course`;

CREATE TABLE IF NOT EXISTS `sub_materials` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `material_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `video_url` VARCHAR(500) DEFAULT NULL,
  `order_index` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `material_id` (`material_id`),
  CONSTRAINT `sub_materials_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
