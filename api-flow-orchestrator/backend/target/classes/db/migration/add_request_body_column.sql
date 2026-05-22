-- Add request_body column to api_node_execution_results table
ALTER TABLE api_node_execution_results
ADD request_body VARCHAR(MAX);

-- Made with Bob