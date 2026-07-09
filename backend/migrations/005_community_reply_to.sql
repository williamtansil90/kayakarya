ALTER TABLE `community_topics`
  ADD COLUMN `reply_to_id` INT DEFAULT NULL AFTER `parent_id`,
  ADD KEY `reply_to_id` (`reply_to_id`),
  ADD CONSTRAINT `community_topics_ibfk_4` FOREIGN KEY (`reply_to_id`) REFERENCES `community_topics` (`id`);
