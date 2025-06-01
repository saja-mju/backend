-- db/schema.sql: Database schema for 사자성어 백엔드

-- 1. users 테이블
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- 2. idioms 테이블
DROP TABLE IF EXISTS idioms;
CREATE TABLE idioms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  word VARCHAR(20) NOT NULL,
  reading VARCHAR(255),
  meaning TEXT NOT NULL,
  synonyms JSON,
  antonyms TEXT,
  difficulty CHAR(10)
);

-- 3. scores 테이블
DROP TABLE IF EXISTS scores;
CREATE TABLE scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  correct_ids JSON,
  FOREIGN KEY (username) REFERENCES users(username)
);

-- 4. correct_answers 테이블
DROP TABLE IF EXISTS correct_answers;
CREATE TABLE correct_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  idiom_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mode ENUM('basic','synonym','hanja'),
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 5. wrong_answers 테이블
DROP TABLE IF EXISTS wrong_answers;
CREATE TABLE wrong_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  idiom_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  mode ENUM('basic','synonym','hanja'),
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 6. daily_answers 테이블
DROP TABLE IF EXISTS daily_answers;
CREATE TABLE daily_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  idiom_id INT NOT NULL,
  date DATE NOT NULL,
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 7. synonym_quiz_history 테이블
DROP TABLE IF EXISTS synonym_quiz_history;
CREATE TABLE synonym_quiz_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  idiom_id INT NOT NULL,
  correct_answers JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 8. viewed_cards 테이블
DROP TABLE IF EXISTS viewed_cards;
CREATE TABLE viewed_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  idiom_id INT NOT NULL,
  viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 9. favorites 테이블: 즐겨찾기
DROP TABLE IF EXISTS favorites;
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  idiom_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (username) REFERENCES users(username),
  FOREIGN KEY (idiom_id) REFERENCES idioms(id)
);

-- 10. idioms_backup 테이블: 데이터 백업용
DROP TABLE IF EXISTS idioms_backup;
CREATE TABLE idioms_backup LIKE idioms;

-- 11. daily_answers 테이블에 user_answer와 is_correct 컬럼 추가
ALTER TABLE `daily_answers`
  ADD COLUMN `user_answer` VARCHAR(255) NOT NULL AFTER `idiom_id`,
  ADD COLUMN `is_correct` TINYINT(1) NOT NULL DEFAULT 0 AFTER `user_answer`;

