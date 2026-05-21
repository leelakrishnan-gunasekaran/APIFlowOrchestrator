-- Step 1: Check current users table structure
PRINT '=== Current users table structure ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'users'
ORDER BY 
    ORDINAL_POSITION;
GO

-- Step 2: Check if password column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'password')
BEGIN
    PRINT 'Password column does NOT exist. Adding it now...';
    
    -- Add password column as nullable first
    ALTER TABLE users ADD password NVARCHAR(255) NULL;
    PRINT 'Password column added as nullable.';
    
    -- Set default password for all existing users
    UPDATE users SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    PRINT 'Default password set for all users.';
    
    -- Make it NOT NULL
    ALTER TABLE users ALTER COLUMN password NVARCHAR(255) NOT NULL;
    PRINT 'Password column is now NOT NULL.';
END
ELSE
BEGIN
    PRINT 'Password column already exists.';
END
GO

-- Step 3: Check if role column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'role')
BEGIN
    PRINT 'Role column does NOT exist. Adding it now...';
    
    ALTER TABLE users ADD role NVARCHAR(255) NULL;
    UPDATE users SET role = 'Developer' WHERE role IS NULL;
    ALTER TABLE users ALTER COLUMN role NVARCHAR(255) NOT NULL;
    PRINT 'Role column added.';
END
ELSE
BEGIN
    PRINT 'Role column already exists.';
END
GO

-- Step 4: Check if enabled column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'enabled')
BEGIN
    PRINT 'Enabled column does NOT exist. Adding it now...';
    
    ALTER TABLE users ADD enabled BIT NULL DEFAULT 1;
    UPDATE users SET enabled = 1 WHERE enabled IS NULL;
    PRINT 'Enabled column added.';
END
ELSE
BEGIN
    PRINT 'Enabled column already exists.';
END
GO

-- Step 5: Check if created_at column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'created_at')
BEGIN
    PRINT 'Created_at column does NOT exist. Adding it now...';
    
    ALTER TABLE users ADD created_at DATETIME2 NULL;
    UPDATE users SET created_at = GETDATE() WHERE created_at IS NULL;
    PRINT 'Created_at column added.';
END
ELSE
BEGIN
    PRINT 'Created_at column already exists.';
END
GO

-- Step 6: Check if last_login column exists
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'users') AND name = 'last_login')
BEGIN
    PRINT 'Last_login column does NOT exist. Adding it now...';
    
    ALTER TABLE users ADD last_login DATETIME2 NULL;
    PRINT 'Last_login column added.';
END
ELSE
BEGIN
    PRINT 'Last_login column already exists.';
END
GO

-- Step 7: Show final table structure
PRINT '';
PRINT '=== Final users table structure ===';
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'users'
ORDER BY 
    ORDINAL_POSITION;
GO

-- Step 8: Show current users
PRINT '';
PRINT '=== Current users in table ===';
SELECT id, username, role, enabled, created_at FROM users;
GO

-- Step 9: Insert admin user if doesn't exist
IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
BEGIN
    INSERT INTO users (username, password, role, enabled, created_at)
    VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin', 1, GETDATE());
    PRINT 'Admin user created.';
END
ELSE
BEGIN
    PRINT 'Admin user already exists.';
END
GO

PRINT '';
PRINT '=== MIGRATION COMPLETE ===';
PRINT 'Now restart your Spring Boot application.';
PRINT 'Login with: username=admin, password=password123';

-- Made with Bob
