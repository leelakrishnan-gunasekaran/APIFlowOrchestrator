import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download, Filter, Search, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import axios from 'axios';
import { generateBulkTestReportPDF } from '../utils/pdfGenerator';
import './TestResultsDashboard.css';

const TestResultsDashboard = ({ runId, onClose }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('ALL'); // ALL, PASSED, FAILED
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTests, setExpandedTests] = useState(new Set());

  useEffect(() => {
    if (runId) {
      fetchResults();
    }
  }, [runId]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/bulk-test/results/${runId}`);
      setResults(response.data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.response?.data?.error || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const toggleTestExpansion = (testCaseId) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId);
    } else {
      newExpanded.add(testCaseId);
    }
    setExpandedTests(newExpanded);
  };

  const getFilteredTests = () => {
    if (!results?.testCaseResults) return [];
    
    let filtered = results.testCaseResults;
    
    // Apply status filter
    if (filter !== 'ALL') {
      filtered = filtered.filter(test => test.status === filter);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(test => 
        test.testCaseId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const exportResults = async (format) => {
    try {
      const response = await axios.get(`/api/bulk-test/export/${runId}?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-results-${runId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting results:', err);
      alert('Failed to export results');
    }
  };

  const generatePDFReport = () => {
    try {
      const result = generateBulkTestReportPDF(results);
      if (result.success) {
        alert(`PDF report generated successfully: ${result.fileName}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF report: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="results-dashboard-overlay">
        <div className="results-dashboard-modal">
          <div className="loading-spinner">Loading results...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-dashboard-overlay">
        <div className="results-dashboard-modal">
          <div className="error-message">
            <XCircle size={24} />
            <span>{error}</span>
          </div>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!results) return null;

  const passRate = results.totalTests > 0 
    ? ((results.passedTests / results.totalTests) * 100).toFixed(1)
    : 0;

  const filteredTests = getFilteredTests();

  return (
    <div className="results-dashboard-overlay" onClick={onClose}>
      <div className="results-dashboard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h2>Test Results</h2>
            <p className="run-info">
              Run ID: {results.id} | {results.fileName} | 
              Started: {new Date(results.startedAt).toLocaleString()}
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Summary Statistics */}
        <div className="summary-stats">
          <div className="stat-card total">
            <div className="stat-icon">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <h3>{results.totalTests}</h3>
              <p>Total Tests</p>
            </div>
          </div>

          <div className="stat-card passed">
            <div className="stat-icon">
              <CheckCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>{results.passedTests}</h3>
              <p>Passed</p>
            </div>
          </div>

          <div className="stat-card failed">
            <div className="stat-icon">
              <XCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>{results.failedTests}</h3>
              <p>Failed</p>
            </div>
          </div>

          <div className="stat-card pass-rate">
            <div className="stat-content">
              <h3>{passRate}%</h3>
              <p>Pass Rate</p>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="stat-card duration">
            <div className="stat-content">
              <h3>{(results.totalDuration / 1000).toFixed(2)}s</h3>
              <p>Total Duration</p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="dashboard-controls">
          <div className="filter-section">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilter('ALL')}
              >
                All ({results.totalTests})
              </button>
              <button 
                className={`filter-btn ${filter === 'PASSED' ? 'active' : ''}`}
                onClick={() => setFilter('PASSED')}
              >
                Passed ({results.passedTests})
              </button>
              <button 
                className={`filter-btn ${filter === 'FAILED' ? 'active' : ''}`}
                onClick={() => setFilter('FAILED')}
              >
                Failed ({results.failedTests})
              </button>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search test cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="export-section">
            <button className="export-btn pdf-btn" onClick={generatePDFReport}>
              <FileText size={18} />
              Generate PDF Report
            </button>
            <button className="export-btn" onClick={() => exportResults('json')}>
              <Download size={18} />
              Export JSON
            </button>
            <button className="export-btn" onClick={() => exportResults('csv')}>
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Test Results List */}
        <div className="test-results-list">
          {filteredTests.length === 0 ? (
            <div className="no-results">
              <p>No test cases found matching the current filters.</p>
            </div>
          ) : (
            filteredTests.map((test) => (
              <div key={test.id} className={`test-result-item ${test.status.toLowerCase()}`}>
                <div 
                  className="test-result-header"
                  onClick={() => toggleTestExpansion(test.testCaseId)}
                >
                  <div className="test-info">
                    <div className="test-status-icon">
                      {test.status === 'PASSED' ? (
                        <CheckCircle size={24} className="icon-passed" />
                      ) : (
                        <XCircle size={24} className="icon-failed" />
                      )}
                    </div>
                    <div>
                      <h4>{test.testCaseId}</h4>
                      <p className="test-meta">
                        Sequence: {test.sequenceNumber} | 
                        Duration: {test.executionTime}ms | 
                        Status Code: {test.statusCode || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="expand-icon">
                    {expandedTests.has(test.testCaseId) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {expandedTests.has(test.testCaseId) && (
                  <div className="test-result-details">
                    {/* Input Variables */}
                    <div className="detail-section">
                      <h5>Input Variables</h5>
                      <pre className="json-display">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(test.inputVariables || '{}'), null, 2);
                          } catch (e) {
                            return test.inputVariables || 'No input variables';
                          }
                        })()}
                      </pre>
                    </div>

                    {/* Assertions */}
                    {test.assertionResults && test.assertionResults.length > 0 && (
                      <div className="detail-section">
                        <h5>Assertions ({test.assertionResults.length})</h5>
                        <div className="assertions-list">
                          {test.assertionResults.map((assertion, idx) => (
                            <div 
                              key={idx} 
                              className={`assertion-item ${assertion.status.toLowerCase()}`}
                            >
                              <div className="assertion-header">
                                {assertion.status === 'PASSED' ? (
                                  <CheckCircle size={16} className="icon-passed" />
                                ) : (
                                  <XCircle size={16} className="icon-failed" />
                                )}
                                <span className="assertion-name">{assertion.assertionName}</span>
                                <span className="assertion-type">{assertion.assertionType}</span>
                              </div>
                              <div className="assertion-details">
                                <div className="assertion-value">
                                  <span className="label">Expected:</span>
                                  <span className="value">{assertion.expectedValue}</span>
                                </div>
                                <div className="assertion-value">
                                  <span className="label">Actual:</span>
                                  <span className="value">{assertion.actualValue}</span>
                                </div>
                                {assertion.errorMessage && (
                                  <div className="assertion-error">
                                    {assertion.errorMessage}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* API Response */}
                    {test.apiResponse && (
                      <div className="detail-section">
                        <h5>API Response</h5>
                        <pre className="json-display">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(test.apiResponse), null, 2);
                            } catch (e) {
                              return test.apiResponse;
                            }
                          })()}
                        </pre>
                      </div>
                    )}

                    {/* Error Message */}
                    {test.errorMessage && (
                      <div className="detail-section error">
                        <h5>Error</h5>
                        <p className="error-text">{test.errorMessage}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsDashboard;

// Made with Bob
