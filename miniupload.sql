
DROP DATABASE IF EXISTS `miniupload_db`

CREATE DATABASE `miniupload_db`

USE `miniupload_db`;

DROP TABLE IF EXISTS `files`;

CREATE TABLE `files` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `filename` TEXT,
    `original_name` TEXT,
    `size` INT,
    `upload_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `download_id` VARCHAR(255),
    `is_shared` BOOLEAN DEFAULT FALSE,
    `shared_mode` ENUM ('public', 'private') DEFAULT NULL,
    `shared_with` JSON DEFAULT NULL,
    UNIQUE KEY `download_id` (`download_id`),
    KEY `user_id` (`user_id`),
    CONSTRAINT `files_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

DROP TABLE IF EXISTS `users`;

CREATE TABLE
  `users` (
    `id` int (11) NOT NULL AUTO_INCREMENT,
    `username` varchar(255) DEFAULT NULL,
    `password` text DEFAULT NULL,
    `is_admin` tinyint (4) DEFAULT 0,
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
  ) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_uca1400_ai_ci;