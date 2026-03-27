-- Script to check database schema and help debug migration 011 issues
-- Run this in your MySQL client to verify table structures

-- 1. Check if questions_bank table exists and describe its structure
DESCRIBE questions_bank;

-- 2. Check if question_recommendations table exists
SHOW TABLES LIKE 'question_recommendations';

-- 3. If question_recommendations exists, describe it
DESCRIBE question_recommendations;

-- 4. Check the data type of questions_bank.id column specifically
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'questions_bank' 
    AND COLUMN_NAME = 'id';

-- 5. Check if question_recommendations table has the question_id column
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'question_recommendations' 
    AND COLUMN_NAME = 'question_id';

-- 6. Check for any existing foreign key constraints on question_recommendations
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'question_recommendations'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 7. Check the current alembic version
SELECT version_num FROM alembic_version;

-- 8. Show all tables in the database
SHOW TABLES;
