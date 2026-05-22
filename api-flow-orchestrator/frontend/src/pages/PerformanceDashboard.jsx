import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronRight, ChevronDown, ArrowLeft, GitCompare } from 'lucide-react';
import { executionService, apiGroupService } from '../services/api';
import './PerformanceDashboard.css';

function PerformanceDashboard() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState('');
  const [executionHistory, setExecutionHistory] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  useEffect(() => {
    fetchGroupDetails();
    fetchExecutionHistory();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      const response = await apiGroupService.getById(groupId);
      setGroupName(response.data?.name || 'API Group');
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

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
    if (compareMode) return; // Disable run selection in compare mode
    setSelectedRun(selectedRun?.id === run.id ? null : run);
    setSelectedApi(null);
  };

  const handleApiClick = (api) => {
    // If clicking the same API, toggle it off, otherwise select the new API
    if (selectedApi?.id === api.id) {
      setSelectedApi(null);
    } else {
      setSelectedApi(api);
    }
  };

  const handleClose = () => {
    navigate(-1);
  };

  const handleCompareToggle = () => {
    setCompareMode(!compareMode);
    setSelectedForCompare([]);
    if (!compareMode) {
      setSelectedRun(null);
      setSelectedApi(null);
    }
  };

  const handleCompareCheckbox = (run) => {
    if (selectedForCompare.find(r => r.id === run.id)) {
      setSelectedForCompare(selectedForCompare.filter(r => r.id !== run.id));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, run]);
    }
  };

  const calculatePerformanceDiff = (duration1, duration2) => {
    if (!duration1 || !duration2) return null;
    const diff = duration2 - duration1;
    const percentChange = ((diff / duration1) * 100).toFixed(1);
    return { diff, percentChange };
  };

  const renderPerformanceChart = () => {
    if (compareMode && selectedForCompare.length === 2) {
      // Comparison mode
      const run1 = selectedForCompare[0];
      const run2 = selectedForCompare[1];
      
      const allDurations = [
        ...run1.apiRunResults.map(r => r.duration || 0),
        ...run2.apiRunResults.map(r => r.duration || 0)
      ];
      const maxDuration = Math.max(...allDurations);

      return (
        <div className="chart-container">
          <h3>Performance Comparison</h3>
          <div className="comparison-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#4caf50' }}></span>
              <span>Run 1: {formatDateTime(run1.executedAt)}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ backgroundColor: '#2196f3' }}></span>
              <span>Run 2: {formatDateTime(run2.executedAt)}</span>
            </div>
          </div>
          <div className="bar-chart">
            {run1.apiRunResults.map((result1, index) => {
              const result2 = run2.apiRunResults[index];
              const diff = result2 ? calculatePerformanceDiff(result1.duration, result2.duration) : null;
              
              return (
                <div key={result1.id || index} className="bar-item comparison-bar-item">
                  <div className="bar-label">
                    {result1.nodeName || `API ${index + 1}`}
                    {diff && (
                      <span className={`diff-indicator ${diff.diff > 0 ? 'slower' : 'faster'}`}>
                        {diff.diff > 0 ? '+' : ''}{diff.percentChange}%
                      </span>
                    )}
                  </div>
                  <div className="comparison-bars">
                    <div className="bar-wrapper">
                      <div
                        className="bar"
                        style={{
                          width: `${(result1.duration / maxDuration) * 100}%`,
                          backgroundColor: '#4caf50'
                        }}
                      >
                        <span className="bar-value">{formatDuration(result1.duration)}</span>
                      </div>
                    </div>
                    {result2 && (
                      <div className="bar-wrapper">
                        <div
                          className="bar"
                          style={{
                            width: `${(result2.duration / maxDuration) * 100}%`,
                            backgroundColor: '#2196f3'
                          }}
                        >
                          <span className="bar-value">{formatDuration(result2.duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

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
    <div className="performance-dashboard-page">
      <div className="dashboard-header">
        <div className="header-left">
          <button className="back-button" onClick={handleClose}>
            <ArrowLeft size={20} />
            Back
          </button>
          <h1>Performance Dashboard - {groupName}</h1>
        </div>
        <div className="header-right">
          <button
            className={`compare-button ${compareMode ? 'active' : ''}`}
            onClick={handleCompareToggle}
          >
            <GitCompare size={18} />
            {compareMode ? 'Exit Compare' : 'Compare'}
          </button>
          {compareMode && (
            <span className="compare-info">
              {selectedForCompare.length}/2 selected
            </span>
          )}
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Left Section: Execution History */}
        <div className="dashboard-section execution-history-section">
          <h2>API Group Running History</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : executionHistory.length === 0 ? (
            <div className="no-data">No execution history available</div>
          ) : (
            <div className="history-list">
              {executionHistory.map((run) => (
                <div key={run.id} className={`history-item ${compareMode ? 'compare-mode' : ''}`}>
                  <div
                    className="history-header"
                    onClick={() => handleRunClick(run)}
                  >
                    {compareMode && (
                      <input
                        type="checkbox"
                        className="compare-checkbox"
                        checked={selectedForCompare.some(r => r.id === run.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleCompareCheckbox(run);
                        }}
                        disabled={!selectedForCompare.some(r => r.id === run.id) && selectedForCompare.length >= 2}
                      />
                    )}
                    <div className="history-title">
                      {!compareMode && (selectedRun?.id === run.id ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      ))}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Middle Section: APIs and Request/Response */}
        <div className="dashboard-section-middle">
          {/* APIs in the API Group */}
          <div className="dashboard-section apis-list-section">
            <h2>APIs in the API Group</h2>
            {compareMode && selectedForCompare.length === 2 ? (
              <div className="api-results-list comparison-api-list">
                {selectedForCompare[0].apiRunResults.map((result1, index) => {
                  const result2 = selectedForCompare[1].apiRunResults[index];
                  const diff = result2 ? calculatePerformanceDiff(result1.duration, result2.duration) : null;
                  
                  return (
                    <div key={`compare-${index}`} className="comparison-api-group">
                      <div className="api-name-header">
                        <span className="api-name">{result1.nodeName || `API ${index + 1}`}</span>
                        {diff && (
                          <span className={`diff-indicator ${diff.diff > 0 ? 'slower' : 'faster'}`}>
                            {diff.diff > 0 ? '+' : ''}{diff.percentChange}%
                          </span>
                        )}
                      </div>
                      <div className="comparison-api-items">
                        <div
                          className={`api-result-item comparison-item run1 ${selectedApi?.id === result1.id ? 'selected' : ''}`}
                          onClick={() => handleApiClick(result1)}
                        >
                          <div className="api-result-header">
                            <div className="api-result-title">
                              <span className="run-indicator" style={{ backgroundColor: '#4caf50' }}></span>
                              <span className={`method-badge method-${(result1.method || '').toLowerCase()}`}>
                                {result1.method || 'N/A'}
                              </span>
                              <span>Run 1</span>
                            </div>
                            <div className="api-result-meta">
                              <span className="duration">{formatDuration(result1.duration)}</span>
                              <span
                                className="status-indicator"
                                style={{ backgroundColor: getStatusColor(result1.status) }}
                              />
                            </div>
                          </div>
                        </div>
                        {result2 && (
                          <div
                            className={`api-result-item comparison-item run2 ${selectedApi?.id === result2.id ? 'selected' : ''}`}
                            onClick={() => handleApiClick(result2)}
                          >
                            <div className="api-result-header">
                              <div className="api-result-title">
                                <span className="run-indicator" style={{ backgroundColor: '#2196f3' }}></span>
                                <span className={`method-badge method-${(result2.method || '').toLowerCase()}`}>
                                  {result2.method || 'N/A'}
                                </span>
                                <span>Run 2</span>
                              </div>
                              <div className="api-result-meta">
                                <span className="duration">{formatDuration(result2.duration)}</span>
                                <span
                                  className="status-indicator"
                                  style={{ backgroundColor: getStatusColor(result2.status) }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : selectedRun && selectedRun.apiRunResults ? (
              <div className="api-results-list">
                {selectedRun.apiRunResults.map((result, index) => (
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
                        <span className={`method-badge method-${(result.method || '').toLowerCase()}`}>
                          {result.method || 'N/A'}
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Select an execution run to view APIs</div>
            )}
          </div>

          {/* Request and Response */}
          <div className="dashboard-section request-response-section">
            <div className="request-response-grid">
              <div className="request-section">
                <h3>Request</h3>
                {selectedApi ? (
                  <div className="detail-content">
                    <p><strong>URL:</strong> {selectedApi.url || 'N/A'}</p>
                    <p><strong>Method:</strong> {selectedApi.method || 'N/A'}</p>
                    <p><strong>Status Code:</strong> {selectedApi.statusCode || 'N/A'}</p>
                    <p><strong>Duration:</strong> {formatDuration(selectedApi.duration)}</p>
                    {selectedApi.requestBody && (
                      <>
                        <p><strong>Request Body:</strong></p>
                        <pre className="response-body">
                          {(() => {
                            try {
                              const parsed = typeof selectedApi.requestBody === 'string'
                                ? JSON.parse(selectedApi.requestBody)
                                : selectedApi.requestBody;
                              return JSON.stringify(parsed, null, 2);
                            } catch (e) {
                              return selectedApi.requestBody;
                            }
                          })()}
                        </pre>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="no-data">Select an API to view request details</div>
                )}
              </div>
              <div className="response-section">
                <h3>Response</h3>
                {selectedApi ? (
                  <div className="detail-content">
                    {selectedApi.error ? (
                      <div className="error-message">
                        <strong>Error:</strong> {selectedApi.error}
                      </div>
                    ) : (
                      <pre className="response-body">
                        {selectedApi.response ? (() => {
                          try {
                            const parsed = typeof selectedApi.response === 'string'
                              ? JSON.parse(selectedApi.response)
                              : selectedApi.response;
                            return JSON.stringify(parsed, null, 2);
                          } catch (e) {
                            return selectedApi.response;
                          }
                        })() : 'No response data'}
                      </pre>
                    )}
                  </div>
                ) : (
                  <div className="no-data">Select an API to view response</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Performance Chart */}
        <div className="dashboard-section performance-chart-section">
          <h2>Performance Chart</h2>
          {renderPerformanceChart()}
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;

// Made with Bob