-- Create api_requests table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'api_requests') AND type in (N'U'))
BEGIN
    CREATE TABLE api_requests (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        method NVARCHAR(50) NOT NULL,
        url NVARCHAR(2000) NOT NULL,
        headers NVARCHAR(MAX),
        request_body NVARCHAR(MAX),
        export_response BIT DEFAULT 0,
        sequence_order INT,
        collection_id BIGINT,
        folder_id BIGINT,
        created_at DATETIME2,
        updated_at DATETIME2,
        CONSTRAINT FK_api_requests_collection FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE NO ACTION,
        CONSTRAINT FK_api_requests_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE NO ACTION
    );
    
    PRINT 'Table api_requests created successfully';
END
ELSE
BEGIN
    PRINT 'Table api_requests already exists';
END
GO

-- Create api_request_field_mappings table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'api_request_field_mappings') AND type in (N'U'))
BEGIN
    CREATE TABLE api_request_field_mappings (
        api_request_id BIGINT NOT NULL,
        field_name NVARCHAR(255) NOT NULL,
        field_value NVARCHAR(MAX),
        PRIMARY KEY (api_request_id, field_name),
        CONSTRAINT FK_field_mappings_request FOREIGN KEY (api_request_id) REFERENCES api_requests(id) ON DELETE NO ACTION
    );
    
    PRINT 'Table api_request_field_mappings created successfully';
END
ELSE
BEGIN
    PRINT 'Table api_request_field_mappings already exists';
END
GO

-- Create api_request_history table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'api_request_history') AND type in (N'U'))
BEGIN
    CREATE TABLE api_request_history (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        api_request_id BIGINT NOT NULL,
        executed_at DATETIME2 NOT NULL,
        success BIT NOT NULL,
        response_status INT,
        response_body NVARCHAR(MAX),
        duration_ms BIGINT,
        error_message NVARCHAR(MAX),
        CONSTRAINT FK_history_request FOREIGN KEY (api_request_id) REFERENCES api_requests(id) ON DELETE NO ACTION
    );
    
    CREATE INDEX IDX_history_request_id ON api_request_history(api_request_id);
    CREATE INDEX IDX_history_executed_at ON api_request_history(executed_at DESC);
    
    PRINT 'Table api_request_history created successfully';
END
ELSE
BEGIN
    PRINT 'Table api_request_history already exists';
END
GO

-- Made with Bob
