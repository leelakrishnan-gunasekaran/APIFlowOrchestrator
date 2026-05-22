-- Add missing columns to api_request_history table
-- This migration adds all required columns for the history feature

-- Add method column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'method')
BEGIN
    ALTER TABLE api_request_history ADD method VARCHAR(10) NOT NULL DEFAULT 'GET';
    PRINT 'Added method column';
END

-- Add url column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'url')
BEGIN
    ALTER TABLE api_request_history ADD url VARCHAR(2000) NOT NULL DEFAULT '';
    PRINT 'Added url column';
END

-- Add request_headers column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'request_headers')
BEGIN
    ALTER TABLE api_request_history ADD request_headers VARCHAR(5000) NULL;
    PRINT 'Added request_headers column';
END

-- Add request_body column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'request_body')
BEGIN
    ALTER TABLE api_request_history ADD request_body VARCHAR(MAX) NULL;
    PRINT 'Added request_body column';
END

-- Add response_headers column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'response_headers')
BEGIN
    ALTER TABLE api_request_history ADD response_headers VARCHAR(5000) NULL;
    PRINT 'Added response_headers column';
END

-- Add response_body column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'response_body')
BEGIN
    ALTER TABLE api_request_history ADD response_body VARCHAR(MAX) NULL;
    PRINT 'Added response_body column';
END

-- Add response_status column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'response_status')
BEGIN
    ALTER TABLE api_request_history ADD response_status INT NULL;
    PRINT 'Added response_status column';
END

-- Add response_status_text column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'response_status_text')
BEGIN
    ALTER TABLE api_request_history ADD response_status_text VARCHAR(100) NULL;
    PRINT 'Added response_status_text column';
END

-- Add duration_ms column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'duration_ms')
BEGIN
    ALTER TABLE api_request_history ADD duration_ms BIGINT NULL;
    PRINT 'Added duration_ms column';
END

-- Add response_size column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'response_size')
BEGIN
    ALTER TABLE api_request_history ADD response_size BIGINT NULL;
    PRINT 'Added response_size column';
END

-- Add success column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'success')
BEGIN
    ALTER TABLE api_request_history ADD success BIT NULL;
    PRINT 'Added success column';
END

-- Add error_message column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'error_message')
BEGIN
    ALTER TABLE api_request_history ADD error_message VARCHAR(2000) NULL;
    PRINT 'Added error_message column';
END

-- Add executed_at column
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'api_request_history') AND name = 'executed_at')
BEGIN
    ALTER TABLE api_request_history ADD executed_at DATETIME2 NOT NULL DEFAULT GETDATE();
    PRINT 'Added executed_at column';
END

PRINT 'Migration completed successfully - all columns added to api_request_history table';

-- Made with Bob
