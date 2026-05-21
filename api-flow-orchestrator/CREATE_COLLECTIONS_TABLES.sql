-- Create Collections Table
-- This script creates the collections table and updates related tables for the API Flow Orchestrator

USE INTEGRATION;
GO

-- Create collections table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'collections')
BEGIN
    CREATE TABLE collections (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000),
        created_at DATETIME2,
        updated_at DATETIME2
    );
    PRINT 'Table collections created successfully';
END
ELSE
BEGIN
    PRINT 'Table collections already exists';
END
GO

-- Create folders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'folders')
BEGIN
    CREATE TABLE folders (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NVARCHAR(1000),
        collection_id BIGINT,
        parent_folder_id BIGINT,
        created_at DATETIME2,
        updated_at DATETIME2,
        CONSTRAINT FK_folders_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        CONSTRAINT FK_folders_parent FOREIGN KEY (parent_folder_id) REFERENCES folders(id)
    );
    PRINT 'Table folders created successfully';
END
ELSE
BEGIN
    PRINT 'Table folders already exists';
END
GO

-- Check if api_requests table exists and add collection_id and folder_id columns if missing
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'api_requests')
BEGIN
    -- Add collection_id column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('api_requests') AND name = 'collection_id')
    BEGIN
        ALTER TABLE api_requests ADD collection_id BIGINT;
        ALTER TABLE api_requests ADD CONSTRAINT FK_api_requests_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE;
        PRINT 'Added collection_id column to api_requests table';
    END
    
    -- Add folder_id column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('api_requests') AND name = 'folder_id')
    BEGIN
        ALTER TABLE api_requests ADD folder_id BIGINT;
        ALTER TABLE api_requests ADD CONSTRAINT FK_api_requests_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
        PRINT 'Added folder_id column to api_requests table';
    END
END
ELSE
BEGIN
    -- Create api_requests table if it doesn't exist
    CREATE TABLE api_requests (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        method NVARCHAR(50) NOT NULL,
        url NVARCHAR(2000) NOT NULL,
        headers NVARCHAR(MAX),
        body NVARCHAR(MAX),
        collection_id BIGINT,
        folder_id BIGINT,
        created_at DATETIME2,
        updated_at DATETIME2,
        CONSTRAINT FK_api_requests_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        CONSTRAINT FK_api_requests_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );
    PRINT 'Table api_requests created successfully';
END
GO

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_folders_collection_id')
BEGIN
    CREATE INDEX idx_folders_collection_id ON folders(collection_id);
    PRINT 'Index idx_folders_collection_id created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_folders_parent_id')
BEGIN
    CREATE INDEX idx_folders_parent_id ON folders(parent_folder_id);
    PRINT 'Index idx_folders_parent_id created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_requests_collection_id')
BEGIN
    CREATE INDEX idx_api_requests_collection_id ON api_requests(collection_id);
    PRINT 'Index idx_api_requests_collection_id created';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_api_requests_folder_id')
BEGIN
    CREATE INDEX idx_api_requests_folder_id ON api_requests(folder_id);
    PRINT 'Index idx_api_requests_folder_id created';
END
GO

-- Verify tables were created
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    ty.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.tables t
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.name IN ('collections', 'folders', 'api_requests')
ORDER BY t.name, c.column_id;
GO

PRINT 'Collections table setup completed successfully!';
PRINT 'You can now restart your Spring Boot application.';
GO

-- Made with Bob
