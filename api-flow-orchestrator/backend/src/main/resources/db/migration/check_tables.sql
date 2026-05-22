-- Query to find all tables related to collections, folders, and requests
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
  AND (TABLE_NAME LIKE '%collection%' 
       OR TABLE_NAME LIKE '%folder%' 
       OR TABLE_NAME LIKE '%request%')
ORDER BY TABLE_NAME;

-- Query to check columns in folders table
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'folders'
ORDER BY ORDINAL_POSITION;

-- Made with Bob
