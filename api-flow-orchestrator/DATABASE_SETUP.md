# Database Setup Guide

## SQL Server Configuration

This application uses Microsoft SQL Server as the persistent database.

### Prerequisites

- SQL Server 2019 or later
- SQL Server Management Studio (SSMS) or Azure Data Studio
- Java 17 or later
- Maven 3.6+

### Database Configuration

The application is configured to connect to SQL Server with the following settings:

```properties
Server: localhost\MSSQLSERVER01
Database: INTEGRATION
Username: sa
Password: 12345
```

### Setup Steps

#### 1. Create Database

Connect to SQL Server and create the database:

```sql
CREATE DATABASE INTEGRATION;
GO

USE INTEGRATION;
GO
```

#### 2. Verify Connection

The application uses these connection settings in `application.properties`:

```properties
spring.datasource.url=jdbc:sqlserver://localhost\\MSSQLSERVER01;databaseName=INTEGRATION;encrypt=false;trustServerCertificate=true
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=sa
spring.datasource.password=12345
```

#### 3. Auto-Generated Tables

When you start the application, Hibernate will automatically create the following tables:

**Core Tables:**
- `api_groups` - API group definitions
- `api_nodes` - Individual API configurations
- `hook_variables` - Variable extraction rules
- `auth_profiles` - Authentication configurations

**Execution Tables:**
- `execution_runs` - Execution history
- `api_run_results` - Individual API execution results
- `performance_baselines` - Performance metrics

**Supporting Tables:**
- `api_node_field_mappings` - Field mapping configurations

### Table Schemas

#### api_groups
```sql
CREATE TABLE api_groups (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000),
    created_at DATETIME2,
    updated_at DATETIME2
);
```

#### api_nodes
```sql
CREATE TABLE api_nodes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    method NVARCHAR(255) NOT NULL,
    url NVARCHAR(2000) NOT NULL,
    sequence_order INT,
    headers NVARCHAR(MAX),
    request_body NVARCHAR(MAX),
    export_response BIT DEFAULT 0,
    api_group_id BIGINT,
    created_at DATETIME2,
    updated_at DATETIME2,
    FOREIGN KEY (api_group_id) REFERENCES api_groups(id)
);
```

#### hook_variables
```sql
CREATE TABLE hook_variables (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    json_path NVARCHAR(255) NOT NULL,
    source_api_node_id BIGINT,
    description NVARCHAR(1000),
    api_group_id BIGINT,
    created_at DATETIME2,
    FOREIGN KEY (api_group_id) REFERENCES api_groups(id)
);
```

#### auth_profiles
```sql
CREATE TABLE auth_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    auth_type NVARCHAR(255) NOT NULL,
    credentials NVARCHAR(2000),
    headers NVARCHAR(MAX),
    api_group_id BIGINT,
    created_at DATETIME2,
    updated_at DATETIME2,
    FOREIGN KEY (api_group_id) REFERENCES api_groups(id)
);
```

#### execution_runs
```sql
CREATE TABLE execution_runs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    api_group_id BIGINT NOT NULL,
    status NVARCHAR(255) NOT NULL,
    start_time DATETIME2,
    end_time DATETIME2,
    total_duration_ms BIGINT,
    is_batch_run BIT DEFAULT 0,
    batch_size INT,
    successful_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    created_at DATETIME2
);
```

#### api_run_results
```sql
CREATE TABLE api_run_results (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    execution_run_id BIGINT,
    api_node_id BIGINT NOT NULL,
    api_node_name NVARCHAR(255),
    sequence_order INT,
    status NVARCHAR(255) NOT NULL,
    status_code INT,
    duration_ms BIGINT,
    request NVARCHAR(MAX),
    response NVARCHAR(MAX),
    error_message NVARCHAR(2000),
    executed_at DATETIME2,
    FOREIGN KEY (execution_run_id) REFERENCES execution_runs(id)
);
```

#### performance_baselines
```sql
CREATE TABLE performance_baselines (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    api_node_id BIGINT NOT NULL,
    avg_duration_ms BIGINT,
    min_duration_ms BIGINT,
    max_duration_ms BIGINT,
    sample_count INT,
    last_updated DATETIME2,
    created_at DATETIME2
);
```

### Running the Application

1. **Ensure SQL Server is running**
   ```bash
   # Check SQL Server service status
   sc query MSSQLSERVER
   ```

2. **Build the application**
   ```bash
   cd api-flow-orchestrator/backend
   mvn clean install
   ```

3. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

4. **Verify database creation**
   - Check the console logs for Hibernate DDL statements
   - Connect to SQL Server and verify tables were created
   - Look for log messages like: `Hibernate: create table api_groups...`

### Troubleshooting

#### Connection Issues

**Problem:** Cannot connect to SQL Server
```
Solution:
1. Verify SQL Server is running
2. Check SQL Server Configuration Manager
3. Enable TCP/IP protocol
4. Verify SQL Server Authentication is enabled
5. Check firewall settings
```

**Problem:** Login failed for user 'sa'
```
Solution:
1. Verify sa account is enabled
2. Reset sa password if needed
3. Check SQL Server authentication mode (Mixed Mode)
```

#### Table Creation Issues

**Problem:** Tables not created automatically
```
Solution:
1. Check spring.jpa.hibernate.ddl-auto=update in application.properties
2. Verify database exists
3. Check user permissions (CREATE TABLE)
4. Review application logs for errors
```

### Database Maintenance

#### Backup Database
```sql
BACKUP DATABASE INTEGRATION
TO DISK = 'C:\Backup\INTEGRATION.bak'
WITH FORMAT, MEDIANAME = 'SQLServerBackups',
NAME = 'Full Backup of INTEGRATION';
```

#### View Table Data
```sql
-- View all API groups
SELECT * FROM api_groups;

-- View API nodes with their groups
SELECT 
    ag.name AS group_name,
    an.name AS api_name,
    an.method,
    an.url,
    an.sequence_order
FROM api_nodes an
JOIN api_groups ag ON an.api_group_id = ag.id
ORDER BY ag.name, an.sequence_order;

-- View execution history
SELECT 
    er.id,
    ag.name AS group_name,
    er.status,
    er.start_time,
    er.total_duration_ms,
    er.successful_count,
    er.failed_count
FROM execution_runs er
JOIN api_groups ag ON er.api_group_id = ag.id
ORDER BY er.start_time DESC;
```

#### Clear Test Data
```sql
-- Clear all execution data
DELETE FROM api_run_results;
DELETE FROM execution_runs;
DELETE FROM performance_baselines;

-- Reset identity seeds
DBCC CHECKIDENT ('api_run_results', RESEED, 0);
DBCC CHECKIDENT ('execution_runs', RESEED, 0);
DBCC CHECKIDENT ('performance_baselines', RESEED, 0);
```

### Performance Optimization

#### Indexes
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_api_nodes_group_id ON api_nodes(api_group_id);
CREATE INDEX idx_api_nodes_sequence ON api_nodes(sequence_order);
CREATE INDEX idx_execution_runs_group_id ON execution_runs(api_group_id);
CREATE INDEX idx_execution_runs_status ON execution_runs(status);
CREATE INDEX idx_api_run_results_execution_id ON api_run_results(execution_run_id);
CREATE INDEX idx_performance_baselines_node_id ON performance_baselines(api_node_id);
```

#### Statistics
```sql
-- Update statistics for better query performance
UPDATE STATISTICS api_groups;
UPDATE STATISTICS api_nodes;
UPDATE STATISTICS execution_runs;
UPDATE STATISTICS api_run_results;
```

### Security Recommendations

1. **Change Default Password**
   - Never use 'sa' with password '12345' in production
   - Create dedicated application user with minimal permissions

2. **Create Application User**
   ```sql
   CREATE LOGIN api_flow_user WITH PASSWORD = 'StrongPassword123!';
   CREATE USER api_flow_user FOR LOGIN api_flow_user;
   
   -- Grant necessary permissions
   GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO api_flow_user;
   ```

3. **Enable SSL/TLS**
   - Configure SQL Server to use encrypted connections
   - Update connection string: `encrypt=true`

4. **Regular Backups**
   - Schedule automated backups
   - Test restore procedures
   - Store backups securely

### Monitoring

#### Check Database Size
```sql
SELECT 
    DB_NAME() AS DatabaseName,
    SUM(size * 8 / 1024) AS SizeMB
FROM sys.database_files;
```

#### Active Connections
```sql
SELECT 
    session_id,
    login_name,
    host_name,
    program_name,
    status
FROM sys.dm_exec_sessions
WHERE database_id = DB_ID('INTEGRATION');
```

#### Query Performance
```sql
-- Top 10 slowest queries
SELECT TOP 10
    qs.execution_count,
    qs.total_elapsed_time / 1000000 AS total_elapsed_time_sec,
    qs.total_elapsed_time / qs.execution_count / 1000000 AS avg_elapsed_time_sec,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1,
        ((CASE qs.statement_end_offset
            WHEN -1 THEN DATALENGTH(qt.text)
            ELSE qs.statement_end_offset
        END - qs.statement_start_offset)/2) + 1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_elapsed_time DESC;
```

## Support

For database-related issues:
1. Check application logs: `logs/spring.log`
2. Review SQL Server error logs
3. Verify connection settings in `application.properties`
4. Ensure database and tables exist
5. Check user permissions

## Made with Bob