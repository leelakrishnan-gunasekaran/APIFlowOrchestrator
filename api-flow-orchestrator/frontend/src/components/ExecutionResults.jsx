import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { executionService } from '../services/api';
import './ExecutionResults.css';

const ExecutionResults = ({ groupId }) => {
  const [expandedRuns, setExpandedRuns] = useState(new Set());
  const [selectedRun, setSelectedRun] = useState(null);

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['executionRuns', groupId],
    queryFn: async () => {
      const response = await executionService.getRunsByGroup(groupId);
      return response.data;
    },
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: runDetails } = useQuery({
    queryKey: ['executionRun', selectedRun],
    queryFn: async () => {
      const response = await executionService.getRunById(selectedRun);
      return response.data;
    },
    enabled: !!selectedRun,
  });

  const toggleRunExpansion = (runId) => {
    const newExpanded = new Set(expandedRuns);
    if (newExpanded.has(runId)) {
      newExpanded.delete(runId);
    } else {
      newExpanded.add(runId);
    }
    setExpandedRuns(newExpanded);
    setSelectedRun(runId);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="status-icon success" size={20} />;
      case 'FAILED':
        return <XCircle className="status-icon error" size={20} />;
      case 'RUNNING':
        return <Clock className="status-icon running" size={20} />;
      default:
        return <Clock className="status-icon" size={20} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'RUNNING':
        return 'running';
      default:
        return '';
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const exportResults = (run, format = 'json') => {
    const data = format === 'json' 
      ? JSON.stringify(run, null, 2)
      : convertToCSV(run);
    
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-${run.id}-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (run) => {
    if (!run.results || run.results.length === 0) return '';
    
    const headers = ['API Name', 'Status', 'Duration (ms)', 'Status Code', 'Response'];
    const rows = run.results.map(result => [
      result.apiNodeName,
      result.status,
      result.durationMs,
      result.statusCode || 'N/A',
      result.responseBody ? JSON.stringify(result.responseBody).substring(0, 100) : 'N/A'
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  };

  if (isLoading) {
    return <div className="loading">Loading execution history...</div>;
  }

  if (runs.length === 0) {
    return (
      <div className="execution-results empty">
        <div className="empty-state">
          <Clock size={48} className="empty-icon" />
          <h3>No Executions Yet</h3>
          <p>Execute your API flow to see results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="execution-results">
      <div className="results-header">
        <h3>Execution History</h3>
        <span className="results-count">{runs.length} run(s)</span>
      </div>

      <div className="results-list">
        {runs.map((run) => (
          <div key={run.id} className={`result-item ${getStatusClass(run.status)}`}>
            <div 
              className="result-summary"
              onClick={() => toggleRunExpansion(run.id)}
            >
              <div className="result-left">
                {expandedRuns.has(run.id) ? (
                  <ChevronDown size={20} className="expand-icon" />
                ) : (
                  <ChevronRight size={20} className="expand-icon" />
                )}
                {getStatusIcon(run.status)}
                <div className="result-info">
                  <span className="result-status">{run.status}</span>
                  <span className="result-time">{formatTimestamp(run.startTime)}</span>
                </div>
              </div>
              
              <div className="result-right">
                <div className="result-stats">
                  <span className="stat">
                    <span className="stat-label">Duration:</span>
                    <span className="stat-value">{formatDuration(run.totalDurationMs)}</span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Success:</span>
                    <span className="stat-value success">{run.successfulCount || 0}</span>
                  </span>
                  <span className="stat">
                    <span className="stat-label">Failed:</span>
                    <span className="stat-value error">{run.failedCount || 0}</span>
                  </span>
                </div>
                <button
                  className="export-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    exportResults(run, 'json');
                  }}
                  title="Export as JSON"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {expandedRuns.has(run.id) && runDetails && (
              <div className="result-details">
                <div className="details-header">
                  <h4>API Execution Details</h4>
                  <div className="export-buttons">
                    <button
                      className="export-detail-btn"
                      onClick={() => exportResults(runDetails, 'json')}
                    >
                      Export JSON
                    </button>
                    <button
                      className="export-detail-btn"
                      onClick={() => exportResults(runDetails, 'csv')}
                    >
                      Export CSV
                    </button>
                  </div>
                </div>

                {runDetails.results && runDetails.results.length > 0 ? (
                  <div className="api-results">
                    {runDetails.results.map((result, index) => (
                      <div key={index} className={`api-result ${result.status.toLowerCase()}`}>
                        <div className="api-result-header">
                          <div className="api-result-title">
                            <span className="api-sequence">#{result.sequenceOrder}</span>
                            <span className="api-name">{result.apiNodeName}</span>
                            <span className={`api-status ${result.status.toLowerCase()}`}>
                              {result.status}
                            </span>
                          </div>
                          <div className="api-result-meta">
                            <span className="api-duration">{formatDuration(result.durationMs)}</span>
                            {result.statusCode && (
                              <span className="api-status-code">
                                Status: {result.statusCode}
                              </span>
                            )}
                          </div>
                        </div>

                        {result.requestBody && (
                          <div className="api-result-section">
                            <h5>Request</h5>
                            <pre className="code-block">
                              {typeof result.requestBody === 'string' 
                                ? result.requestBody 
                                : JSON.stringify(result.requestBody, null, 2)}
                            </pre>
                          </div>
                        )}

                        {result.responseBody && (
                          <div className="api-result-section">
                            <h5>Response</h5>
                            <pre className="code-block">
                              {typeof result.responseBody === 'string'
                                ? result.responseBody
                                : JSON.stringify(result.responseBody, null, 2)}
                            </pre>
                          </div>
                        )}

                        {result.errorMessage && (
                          <div className="api-result-section error">
                            <h5>Error</h5>
                            <pre className="code-block error">
                              {result.errorMessage}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    <p>No detailed results available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionResults;

// Made with Bob
