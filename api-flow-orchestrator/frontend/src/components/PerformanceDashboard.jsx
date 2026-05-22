import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronDown } from 'lucide-react';
import { executionService } from '../services/api';
import './PerformanceDashboard.css';

function PerformanceDashboard({ groupId, groupName, onClose }) {
  const [executionHistory, setExecutionHistory] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExecutionHistory();
  }, [groupId]);

  const fetchExecutionHistory = async () => {
    try {
      setLoading(true);
      const response = await executionService.getRunsByGroup(groupId);
      setExecutionHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching execution history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS':
        return '#4caf50';
      case 'FAILED':
        return '#f44336';
      case 'PARTIAL_SUCCESS':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const handleRunClick = (run) => {
    setSelectedRun(selectedRun?.id === run.id ? null : run);
    setSelectedApi(null);
  };

  const handleApiClick = (api) => {
    setSelectedApi(selectedApi?.id === api.id ? null : api);
  };

  const renderPerformanceChart = () => {
    if (!selectedRun || !selectedRun.apiRunResults || selectedRun.apiRunResults.length === 0) {
      return <div className="no-data">Select an execution run to view performance chart</div>;
    }

    const maxDuration = Math.max(...selectedRun.apiRunResults.map(r => r.duration || 0));

    return (
      <div className="chart-container">
        <h3>API Performance (Duration in ms)</h3>
        <div className="bar-chart">
          {selectedRun.apiRunResults.map((result, index) => (
            <div key={result.id || index} className="bar-item">
              <div className="bar-label">{result.nodeName || `API ${index + 1}`}</div>
              <div className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    width: `${(result.duration / maxDuration) * 100}%`,
                    backgroundColor: result.status === 'SUCCESS' ? '#4caf50' : '#f44336'
                  }}
                >
                  <span className="bar-value">{formatDuration(result.duration)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard">
        <div className="dashboard-header">
          <h2>Performance Dashboard - {groupName}</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="dashboard-content">
          {/* Section 1: Execution History */}
          <div className="dashboard-section execution-history-section">
            <h3>Execution History</h3>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : executionHistory.length === 0 ? (
              <div className="no-data">No execution history available</div>
            ) : (
              <div className="history-list">
                {executionHistory.map((run) => (
                  <div key={run.id} className="history-item">
                    <div
                      className="history-header"
                      onClick={() => handleRunClick(run)}
                    >
                      <div className="history-title">
                        {selectedRun?.id === run.id ? (
                          <ChevronDown size={20} />
                        ) : (
                          <ChevronRight size={20} />
                        )}
                        <span>
                          {groupName}_{formatDateTime(run.executedAt)}
                        </span>
                      </div>
                      <div className="history-meta">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(run.status) }}
                        >
                          {run.status}
                        </span>
                        <span className="node-count">
                          {run.executedNodes}/{run.totalNodes} APIs
                        </span>
                      </div>
                    </div>

                    {selectedRun?.id === run.id && run.apiRunResults && (
                      <div className="api-results-list">
                        {run.apiRunResults.map((result, index) => (
                          <div key={result.id || index} className="api-result-item">
                            <div
                              className="api-result-header"
                              onClick={() => handleApiClick(result)}
                            >
                              <div className="api-result-title">
                                {selectedApi?.id === result.id ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                                <span className={`method-badge method-${result.method.toLowerCase()}`}>
                                  {result.method}
                                </span>
                                <span>{result.nodeName || `API ${index + 1}`}</span>
                              </div>
                              <div className="api-result-meta">
                                <span className="duration">{formatDuration(result.duration)}</span>
                                <span
                                  className="status-indicator"
                                  style={{ backgroundColor: getStatusColor(result.status) }}
                                />
                              </div>
                            </div>

                            {selectedApi?.id === result.id && (
                              <div className="api-details">
                                <div className="detail-section">
                                  <h4>Request</h4>
                                  <div className="detail-content">
                                    <p><strong>URL:</strong> {result.url}</p>
                                    <p><strong>Method:</strong> {result.method}</p>
                                    <p><strong>Status Code:</strong> {result.statusCode || 'N/A'}</p>
                                  </div>
                                </div>
                                <div className="detail-section">
                                  <h4>Response</h4>
                                  <div className="detail-content">
                                    {result.error ? (
                                      <div className="error-message">
                                        <strong>Error:</strong> {result.error}
                                      </div>
                                    ) : (
                                      <pre className="response-body">
                                        {result.response ? JSON.stringify(JSON.parse(result.response), null, 2) : 'No response data'}
                                      </pre>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: API Details */}
          <div className="dashboard-section api-details-section">
            <h3>API Details</h3>
            {selectedApi ? (
              <div className="selected-api-details">
                <div className="detail-row">
                  <span className="detail-label">API Name:</span>
                  <span className="detail-value">{selectedApi.nodeName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Method:</span>
                  <span className={`method-badge method-${selectedApi.method.toLowerCase()}`}>
                    {selectedApi.method}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">URL:</span>
                  <span className="detail-value">{selectedApi.url}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedApi.status) }}
                  >
                    {selectedApi.status}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status Code:</span>
                  <span className="detail-value">{selectedApi.statusCode || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{formatDuration(selectedApi.duration)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Executed At:</span>
                  <span className="detail-value">{formatDateTime(selectedApi.executedAt)}</span>
                </div>
              </div>
            ) : (
              <div className="no-data">Select an API from execution history to view details</div>
            )}
          </div>

          {/* Section 3: Performance Chart */}
          <div className="dashboard-section performance-chart-section">
            {renderPerformanceChart()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;

// Made with Bob