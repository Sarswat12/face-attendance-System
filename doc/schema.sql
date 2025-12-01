-- MySQL schema for Face Recognition Attendance System
-- Generated to match the frontend's expected data model

-- NOTE: Run this on a MySQL server (no Docker). Adjust types/charset as needed.

CREATE DATABASE IF NOT EXISTS `face_attendance` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `face_attendance`;

-- Users table: stores registered users
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` VARCHAR(64) NULL COMMENT 'Human-readable ID like EMP001',
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('admin','employee') NOT NULL DEFAULT 'employee',
  `department` VARCHAR(128) DEFAULT NULL,
  `avatar` VARCHAR(512) DEFAULT NULL,
  `phone` VARCHAR(64) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'Active',
  `join_date` DATE DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  UNIQUE KEY `uq_users_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Faces table: enrollment records for face recognition
CREATE TABLE IF NOT EXISTS `faces` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `face_id` VARCHAR(128) NOT NULL COMMENT 'Unique face identifier (UUID or DB id)',
  `image_path` VARCHAR(512) DEFAULT NULL COMMENT 'Path or URL to stored image',
  `metadata` JSON DEFAULT NULL COMMENT 'Optional metadata (pose, quality, descriptors)',
  `enrolled_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_faces_face_id` (`face_id`),
  INDEX `idx_faces_user_id` (`user_id`),
  CONSTRAINT `fk_faces_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance table: records of attendance marks
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `face_id` VARCHAR(128) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL COMMENT 'Present/Absent/Late/Excused',
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `department` VARCHAR(128) DEFAULT NULL,
  `source` VARCHAR(32) DEFAULT NULL COMMENT 'camera/upload/manual',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_attendance_user_id` (`user_id`),
  INDEX `idx_attendance_face_id` (`face_id`),
  CONSTRAINT `fk_attendance_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table (optional, recommended for token revocation)
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token` TEXT NOT NULL,
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL,
  `revoked` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  INDEX `idx_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: audit/log tables can be created later

-- Sample seed (optional): create an admin user placeholder (change password_hash)
-- INSERT INTO `users` (`user_id`, `name`, `email`, `password_hash`, `role`, `status`) VALUES
-- ('ADMIN001', 'Administrator', 'admin@example.com', '<bcrypt-hash-here>', 'admin', 'Active');

-- End of schema
