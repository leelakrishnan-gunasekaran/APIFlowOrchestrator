-- Create API Group Execution Runs table
CREATE TABLE api_group_execution_runs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    api_group_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    executed_at DATETIME2 NOT NULL,
    total_nodes INT,
    executed_nodes INT
);

-- Create API Node Execution Results table
CREATE TABLE api_node_execution_results (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    execution_run_id BIGINT NOT NULL,
    api_node_id BIGINT NOT NULL,
    node_name VARCHAR(255),
    method VARCHAR(10) NOT NULL,
    url VARCHAR(2000),
    request_body VARCHAR(MAX),
    status VARCHAR(50) NOT NULL,
    status_code INT,
    response VARCHAR(MAX),
    duration_ms BIGINT,
    error VARCHAR(MAX),
    executed_at DATETIME2,
    CONSTRAINT FK_execution_results_run FOREIGN KEY (execution_run_id)
        REFERENCES api_group_execution_runs(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_execution_runs_group_id ON api_group_execution_runs(api_group_id);
CREATE INDEX idx_execution_runs_executed_at ON api_group_execution_runs(executed_at DESC);
CREATE INDEX idx_execution_results_run_id ON api_node_execution_results(execution_run_id);
CREATE INDEX idx_execution_results_node_id ON api_node_execution_results(api_node_id);

-- Made with Bob