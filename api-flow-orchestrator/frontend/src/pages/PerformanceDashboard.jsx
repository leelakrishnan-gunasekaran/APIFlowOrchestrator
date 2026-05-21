import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle, XCircle, BarChart3, GitCompare } from 'lucide-react';
import { executionService, apiGroupService } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './PerformanceDashboard.css';

function PerformanceDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const groupName = location.state?.groupName || 'API Group';
  const [selectedRun, setSelectedRun] = useState(null);
  const [selectedApi, setSelectedApi] = useState(null);
  const [selectedForComparison, setSelectedForComparison] = useState([]);
  const [compareMode, setCompareMode] = useState(false);

  // Fetch group details
  const { data: group } = useQuery({
    queryKey: ['apiGroup', id],
    queryFn: async () => {
      const response = await apiGroupService.getById(id);
      return response.data;
    },
  });

  // Fetch execution history
  const { data: executionRuns = [], isLoading } = useQuery({
    queryKey: ['executionHistory', id],
    queryFn: async () => {
      const response = await executionService.getRunsByGroup(id);
      return response.data || [];
    },
  });

  // Format date for history name
  const formatHistoryName = (run) => {
    const date = new Date(run.startTime);
    const dateStr = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    return `${group?.name || groupName}_${dateStr}_${timeStr}`;
  };

  // Prepare chart data for selected run
  const getChartData = () => {
    if (!selectedRun || !selectedRun.apiRunResults) return [];
    
    return selectedRun.apiRunResults.map(result => ({
      name: result.apiNodeName || `API ${result.sequenceOrder}`,
      duration: result.durationMs || 0,
      status: result.status
    }));
  };

  // Handle checkbox selection for comparison
  const handleComparisonSelect = (run, checked) => {
    if (checked) {
      if (selectedForComparison.length < 2) {
        setSelectedForComparison([...selectedForComparison, run]);
      }
    } else {
      setSelectedForComparison(selectedForComparison.filter(r => r.id !== run.id));
    }
  };

  // Handle run selection
  const handleRunClick = (run) => {
    if (!compareMode) {
      setSelectedRun(run);
      setSelectedApi(null);
    }
  };

  // Handle compare button click
  const handleCompare = () => {
    if (selectedForComparison.length === 2) {
      setCompareMode(true);
      setSelectedRun(null);
      setSelectedApi(null);
    }
  };

  // Exit compare mode
  const handleExitCompare = () => {
    setCompareMode(false);
    setSelectedForComparison([]);
  };

  // Prepare comparison chart data
  const getComparisonChartData = () => {
    if (selectedForComparison.length !== 2) return [];
    
    const [run1, run2] = selectedForComparison;
    const apiMap = new Map();
    
    // Collect all API names
    run1.apiRunResults?.forEach(result => {
      apiMap.set(result.apiNodeName, { name: result.apiNodeName });
    });
    
    run2.apiRunResults?.forEach(result => {
      if (!apiMap.has(result.apiNodeName)) {
        apiMap.set(result.apiNodeName, { name: result.apiNodeName });
      }
    });
    
    // Build comparison data
    const comparisonData = Array.from(apiMap.values()).map(item => {
      const result1 = run1.apiRunResults?.find(r => r.apiNodeName === item.name);
      const result2 = run2.apiRunResults?.find(r => r.apiNodeName === item.name);
      
      return {
        name: item.name,
        run1Duration: result1?.durationMs || 0,
        run2Duration: result2?.durationMs || 0,
        difference: (result2?.durationMs || 0) - (result1?.durationMs || 0),
        percentChange: result1?.durationMs ? 
          (((result2?.durationMs || 0) - result1.durationMs) / result1.durationMs * 100).toFixed(1) : 0
      };
    });
    
    return comparisonData;
  };

  // Calculate overall comparison stats
  const getOverallComparison = () => {
    if (selectedForComparison.length !== 2) return null;
    
    const [run1, run2] = selectedForComparison;
    const diff = run2.totalDurationMs - run1.totalDurationMs;
    const percentChange = ((diff / run1.totalDurationMs) * 100).toFixed(1);
    
    return {
      run1Total: run1.totalDurationMs,
      run2Total: run2.totalDurationMs,
      difference: diff,
      percentChange: percentChange,
      improved: diff < 0
    };
  };

  // Handle API selection
  const handleApiClick = (api) => {
    setSelectedApi(api);
  };

  // Format JSON for display
  const formatJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonString;
    }
  };

  if (isLoading) {
    return (
      <div className="performance-dashboard">
        <div className="loading">Loading execution history...</div>
      </div>
    );
  }

  return (
    <div className="performance-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <button 
            className="back-button" 
            onClick={() => window.close()}
            title="Close this tab"
          >
            <ArrowLeft size={20} />
            Close
          </button>
          <div className="header-title">
            <h1>📊 Performance Dashboard</h1>
            <p>{group?.name || groupName}</p>
          </div>
        </div>
        <div className="header-right">
          {!compareMode && (
            <button 
              onClick={handleCompare}
              disabled={selectedForComparison.length !== 2}
              className={`compare-button ${selectedForComparison.length === 2 ? 'enabled' : ''}`}
              title="Select 2 executions to compare"
            >
              <GitCompare size={20} />
              Compare ({selectedForComparison.length}/2)
            </button>
          )}
          {compareMode && (
            <button onClick={handleExitCompare} className="exit-compare-button">
              Exit Compare Mode
            </button>
          )}
        </div>
      </div>

      <div className="dashboard-content">
        {/* Left Panel - Execution History */}
        <div className="history-panel">
          <div className="panel-header">
            <h2>Execution History</h2>
            <span className="count-badge">{executionRuns.length} runs</span>
          </div>
          
          <div className="history-list">
            {executionRuns.length === 0 ? (
              <div className="empty-state">
                <BarChart3 size={48} />
                <p>No execution history yet</p>
                <span>Run your API flow to see results here</span>
              </div>
            ) : (
              executionRuns.map((run) => (
                <div
                  key={run.id}
                  className={`history-item ${selectedRun?.id === run.id ? 'selected' : ''} ${
                    selectedForComparison.find(r => r.id === run.id) ? 'selected-for-comparison' : ''
                  }`}
                  onClick={() => handleRunClick(run)}
                >
                  <div className="history-item-header">
                    <input
                      type="checkbox"
                      checked={selectedForComparison.some(r => r.id === run.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleComparisonSelect(run, e.target.checked);
                      }}
                      disabled={!selectedForComparison.some(r => r.id === run.id) && selectedForComparison.length >= 2}
                      className="comparison-checkbox"
                      title="Select for comparison"
                    />
                    <span className="history-name">{formatHistoryName(run)}</span>
                    <span className={`status-badge status-${run.status.toLowerCase()}`}>
                      {run.status === 'COMPLETED' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                      {run.status}
                    </span>
                  </div>
                  <div className="history-item-details">
                    <span className="detail-item">
                      <Clock size={12} />
                      {run.totalDurationMs} ms
                    </span>
                    <span className="detail-item success">
                      ✓ {run.successfulCount}
                    </span>
                    <span className="detail-item failed">
                      ✗ {run.failedCount}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle Panel - API List & Details or Comparison */}
        <div className="details-panel">
          {compareMode && selectedForComparison.length === 2 ? (
            <>
              <div className="panel-header">
                <h2>Comparison View</h2>
              </div>
              
              <div className="comparison-info">
                <div className="comparison-runs">
                  <div className="comparison-run run1">
                    <span className="run-label">Run 1:</span>
                    <span className="run-name">{formatHistoryName(selectedForComparison[0])}</span>
                  </div>
                  <div className="comparison-run run2">
                    <span className="run-label">Run 2:</span>
                    <span className="run-name">{formatHistoryName(selectedForComparison[1])}</span>
                  </div>
                </div>
              </div>

              <div className="overall-comparison">
                <h3>Overall Performance</h3>
                {(() => {
                  const overall = getOverallComparison();
                  return (
                    <div className="overall-stats">
                      <div className="stat-row">
                        <span className="stat-label">Run 1 Total:</span>
                        <span className="stat-value run1-color">{overall.run1Total}ms</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Run 2 Total:</span>
                        <span className="stat-value run2-color">{overall.run2Total}ms</span>
                      </div>
                      <div className="stat-row highlight">
                        <span className="stat-label">Difference:</span>
                        <span className={`stat-value ${overall.improved ? 'improved' : 'degraded'}`}>
                          {overall.difference > 0 ? '+' : ''}{overall.difference}ms 
                          ({overall.percentChange > 0 ? '+' : ''}{overall.percentChange}%)
                          {overall.improved ? ' ⬇️ Faster' : ' ⬆️ Slower'}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="api-comparison-list">
                <h3>API-by-API Comparison</h3>
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>API Name</th>
                        <th>Run 1 (ms)</th>
                        <th>Run 2 (ms)</th>
                        <th>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getComparisonChartData().map((item, index) => (
                        <tr key={index}>
                          <td className="api-name-cell">{item.name}</td>
                          <td className="run1-color">{item.run1Duration}</td>
                          <td className="run2-color">{item.run2Duration}</td>
                          <td className={item.difference < 0 ? 'improved' : item.difference > 0 ? 'degraded' : 'neutral'}>
                            {item.difference > 0 ? '+' : ''}{item.difference}ms 
                            ({item.percentChange > 0 ? '+' : ''}{item.percentChange}%)
                            {item.difference < 0 ? ' ⬇️' : item.difference > 0 ? ' ⬆️' : ' ➡️'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : !selectedRun ? (
            <div className="empty-state">
              <p>Select an execution from history to view details</p>
            </div>
          ) : (
            <>
              <div className="panel-header">
                <h2>API Execution Details</h2>
                <span className="timestamp">
                  {new Date(selectedRun.startTime).toLocaleString()}
                </span>
              </div>

              {/* API List */}
              <div className="api-list">
                {selectedRun.apiRunResults && selectedRun.apiRunResults.length > 0 ? (
                  selectedRun.apiRunResults.map((api, index) => (
                    <div
                      key={api.id || index}
                      className={`api-item ${selectedApi?.id === api.id ? 'selected' : ''}`}
                      onClick={() => handleApiClick(api)}
                    >
                      <div className="api-item-header">
                        <span className="api-sequence">#{api.sequenceOrder}</span>
                        <span className="api-name">{api.apiNodeName}</span>
                        <span className={`api-status status-${api.status.toLowerCase()}`}>
                          {api.status}
                        </span>
                      </div>
                      <div className="api-item-meta">
                        <span className="duration">{api.durationMs} ms</span>
                        {api.statusCode && (
                          <span className="status-code">HTTP {api.statusCode}</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <p>No API results available</p>
                  </div>
                )}
              </div>

              {/* Request/Response Details */}
              {selectedApi && (
                <div className="request-response-section">
                  <div className="section-header">
                    <h3>{selectedApi.apiNodeName}</h3>
                  </div>

                  <div className="request-response-grid">
                    {/* Request */}
                    <div className="code-block">
                      <div className="code-block-header">
                        <span>Request Body</span>
                      </div>
                      <pre className="code-content">
                        {selectedApi.request ? formatJson(selectedApi.request) : 'No request body'}
                      </pre>
                    </div>

                    {/* Response */}
                    <div className="code-block">
                      <div className="code-block-header">
                        <span>Response</span>
                        {selectedApi.statusCode && (
                          <span className="status-code-badge">
                            {selectedApi.statusCode}
                          </span>
                        )}
                      </div>
                      <pre className="code-content">
                        {selectedApi.response ? formatJson(selectedApi.response) : 
                         selectedApi.errorMessage || 'No response'}
                      </pre>
                    </div>
                  </div>

                  {/* Error Message */}
                  {selectedApi.errorMessage && (
                    <div className="error-message">
                      <strong>Error:</strong> {selectedApi.errorMessage}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Panel - Performance Chart */}
        <div className="chart-panel">
          <div className="panel-header">
            <h2>Performance Chart</h2>
          </div>

          {compareMode && selectedForComparison.length === 2 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getComparisonChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="run1Duration" 
                    fill="#3b82f6" 
                    name="Run 1"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="run2Duration" 
                    fill="#10b981" 
                    name="Run 2"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : !selectedRun ? (
            <div className="empty-state">
              <BarChart3 size={48} />
              <p>Select an execution to view performance</p>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis label={{ value: 'Duration (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="duration" 
                    fill="#3b82f6" 
                    name="Duration (ms)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Summary Stats */}
              <div className="chart-stats">
                <div className="stat-card">
                  <span className="stat-label">Total Duration</span>
                  <span className="stat-value">{selectedRun.totalDurationMs} ms</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">Average</span>
                  <span className="stat-value">
                    {selectedRun.apiRunResults?.length > 0
                      ? Math.round(selectedRun.totalDurationMs / selectedRun.apiRunResults.length)
                      : 0} ms
                  </span>
                </div>
                <div className="stat-card success">
                  <span className="stat-label">Successful</span>
                  <span className="stat-value">{selectedRun.successfulCount}</span>
                </div>
                <div className="stat-card failed">
                  <span className="stat-label">Failed</span>
                  <span className="stat-value">{selectedRun.failedCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PerformanceDashboard;

// Made with Bob
