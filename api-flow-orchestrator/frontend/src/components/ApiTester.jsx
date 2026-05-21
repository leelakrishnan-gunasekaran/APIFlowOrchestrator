import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { apiGroupService, apiNodeService } from '../services/api';
import './ApiTester.css';

const ApiTester = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [authType, setAuthType] = useState('none');
  const [authConfig, setAuthConfig] = useState({
    token: '',
    username: '',
    password: '',
    apiKey: '',
    apiKeyHeader: 'X-API-Key'
  });
  const [headers, setHeaders] = useState([{ key: '', value: '', enabled: true }]);
  const [body, setBody] = useState('');
  const [bodyType, setBodyType] = useState('json');
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('body');
  const [responseTab, setResponseTab] = useState('body');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveConfig, setSaveConfig] = useState({
    apiName: '',
    selectedGroupId: '',
    newGroupName: '',
    createNewGroup: false
  });
  const [variables, setVariables] = useState([{ name: '', jsonPath: '', value: '' }]);
  const [extractedVariables, setExtractedVariables] = useState({});
  const [requestHistory, setRequestHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Fetch all groups for the save modal
  const { data: groups = [] } = useQuery({
    queryKey: ['apiGroups'],
    queryFn: async () => {
      const response = await apiGroupService.getAll();
      return response.data;
    }
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (requestData) => {
      const startTime = Date.now();
      try {
        // Use proxy endpoint to avoid CORS issues with localhost URLs
        const response = await axios.post('/api/proxy/execute', {
          method: requestData.method,
          url: requestData.url,
          headers: requestData.headers,
          body: typeof requestData.body === 'string' ? requestData.body : JSON.stringify(requestData.body)
        }, {
          validateStatus: () => true // Accept all status codes
        });
        
        const duration = Date.now() - startTime;
        
        // Parse response data if it's a string
        let responseData = response.data;
        if (typeof responseData === 'string') {
          try {
            responseData = JSON.parse(responseData);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: responseData,
          duration,
          size: JSON.stringify(responseData).length
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        throw {
          message: error.response?.data?.message || error.message,
          duration
        };
      }
    },
    onSuccess: (data) => {
      setResponse({
        success: true,
        ...data
      });
      // Extract variables from response
      extractVariablesFromResponse(data.data);
      
      // Add to request history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        method,
        url,
        status: data.status,
        statusText: data.statusText,
        duration: data.duration,
        headers: buildHeaders(),
        body: body || null,
        response: data.data,
        success: true
      };
      setRequestHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50 requests
    },
    onError: (error) => {
      setResponse({
        success: false,
        error: error.message,
        duration: error.duration
      });
      
      // Add failed request to history
      const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        method,
        url,
        status: null,
        statusText: 'Error',
        duration: error.duration,
        headers: buildHeaders(),
        body: body || null,
        response: null,
        error: error.message,
        success: false
      };
      setRequestHistory(prev => [historyItem, ...prev].slice(0, 50));
    }
  });

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const updateHeader = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    setVariables([...variables, { name: '', jsonPath: '', value: '' }]);
  };

  const updateVariable = (index, field, value) => {
    const newVariables = [...variables];
    newVariables[index][field] = value;
    setVariables(newVariables);
  };

  const removeVariable = (index) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Extract value from nested object using dot notation path
  const getValueByPath = (obj, path) => {
    try {
      return path.split('.').reduce((current, key) => {
        if (current === null || current === undefined) return undefined;
        return current[key];
      }, obj);
    } catch (e) {
      return undefined;
    }
  };

  const loadHistoryItem = (item) => {
    setMethod(item.method);
    setUrl(item.url);
    setBody(item.body || '');
    setSelectedHistoryItem(item);
    // Optionally load headers if stored
  };

  const clearHistory = () => {
    if (confirm('Clear all request history?')) {
      setRequestHistory([]);
      setSelectedHistoryItem(null);
    }
  };

  const extractVariablesFromResponse = (responseData) => {
    const extracted = {};
    variables.forEach((variable, index) => {
      if (variable.name && variable.jsonPath) {
        const value = getValueByPath(responseData, variable.jsonPath);
        if (value !== undefined) {
          extracted[variable.name] = value;
          // Update the variable value in the UI
          const newVariables = [...variables];
          newVariables[index].value = String(value);
          setVariables(newVariables);
        }
      }
    });
    setExtractedVariables(extracted);
  };

  const buildHeaders = () => {
    const builtHeaders = {};
    
    // Add custom headers
    headers.forEach(header => {
      if (header.enabled && header.key && header.value) {
        builtHeaders[header.key] = header.value;
      }
    });

    // Add auth headers
    switch (authType) {
      case 'bearer':
        if (authConfig.token) {
          builtHeaders['Authorization'] = `Bearer ${authConfig.token}`;
        }
        break;
      case 'basic':
        if (authConfig.username && authConfig.password) {
          const encoded = btoa(`${authConfig.username}:${authConfig.password}`);
          builtHeaders['Authorization'] = `Basic ${encoded}`;
        }
        break;
      case 'apikey':
        if (authConfig.apiKey && authConfig.apiKeyHeader) {
          builtHeaders[authConfig.apiKeyHeader] = authConfig.apiKey;
        }
        break;
    }

    // Add content type for body
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      if (bodyType === 'json') {
        builtHeaders['Content-Type'] = 'application/json';
      } else if (bodyType === 'xml') {
        builtHeaders['Content-Type'] = 'application/xml';
      } else if (bodyType === 'text') {
        builtHeaders['Content-Type'] = 'text/plain';
      }
    }

    return builtHeaders;
  };

  const handleSend = () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    let requestBody = null;
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      if (bodyType === 'json') {
        try {
          requestBody = JSON.parse(body);
        } catch (e) {
          alert('Invalid JSON in request body');
          return;
        }
      } else {
        requestBody = body;
      }
    }

    sendRequestMutation.mutate({
      method,
      url,
      headers: buildHeaders(),
      body: requestBody
    });
  };

  const handleSave = () => {
    if (!url) {
      alert('Please configure an API request before saving');
      return;
    }
    setShowSaveModal(true);
  };

  const saveApiMutation = useMutation({
    mutationFn: async () => {
      console.log('=== Starting Save API Process ===');
      console.log('Save Config:', saveConfig);
      console.log('Method:', method);
      console.log('URL:', url);
      
      try {
        let groupId = saveConfig.selectedGroupId;

        // Create new group if needed
        if (saveConfig.createNewGroup) {
          if (!saveConfig.newGroupName.trim()) {
            throw new Error('Please enter a group name');
          }
          console.log('Creating new group:', saveConfig.newGroupName);
          const groupResponse = await apiGroupService.create({
            name: saveConfig.newGroupName,
            description: `Created from API Tester`
          });
          console.log('Group response:', groupResponse);
          groupId = groupResponse.data.id;
          console.log('Group created with ID:', groupId);
        } else if (!groupId) {
          throw new Error('Please select a group or create a new one');
        }

        // Prepare headers object
        const headersObj = {};
        headers.forEach(header => {
          if (header.enabled && header.key && header.value) {
            headersObj[header.key] = header.value;
          }
        });
        console.log('Headers object:', headersObj);

        // Prepare field mappings from variables
        const fieldMappings = {};
        variables.forEach(variable => {
          if (variable.name && variable.jsonPath) {
            fieldMappings[variable.name] = variable.jsonPath;
          }
        });
        console.log('Field mappings:', fieldMappings);

        // Create API node
        const nodeData = {
          name: saveConfig.apiName || `${method} ${url}`,
          method: method,
          url: url,
          headers: JSON.stringify(headersObj),
          requestBody: body || null,
          sequenceOrder: null, // Let backend assign sequence order
          fieldMappings: fieldMappings
        };

        console.log('Creating API node with data:', nodeData);
        console.log('Target group ID:', groupId);
        
        const response = await apiNodeService.create(groupId, nodeData);
        console.log('API node created successfully:', response.data);
        console.log('=== Save API Process Complete ===');
        return { groupId, nodeId: response.data.id };
      } catch (error) {
        console.error('=== Save API Process Failed ===');
        console.error('Error details:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Save mutation succeeded:', data);
      alert(`API saved successfully to group ID: ${data.groupId}`);
      setShowSaveModal(false);
      setSaveConfig({
        apiName: '',
        selectedGroupId: '',
        newGroupName: '',
        createNewGroup: false
      });
    },
    onError: (error) => {
      console.error('Save mutation failed:', error);
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
        console.error('Server error response:', error.response.data);
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'No response from server. Is the backend running?';
        console.error('No response received:', error.request);
      } else {
        // Error in request setup
        errorMessage = error.message;
      }
      
      alert(`Failed to save API: ${errorMessage}\n\nCheck browser console for details.`);
    }
  });

  const handleSaveSubmit = () => {
    saveApiMutation.mutate();
  };

  const formatJson = (data) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch (e) {
      return String(data);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 300 && status < 400) return '#f59e0b';
    if (status >= 400 && status < 500) return '#ef4444';
    if (status >= 500) return '#dc2626';
    return '#6b7280';
  };

  return (
    <div className="api-tester">
      <div className="api-tester-header">
        <div>
          <h1>API Tester</h1>
          <p>Test your APIs like Postman</p>
        </div>
        <div className="header-actions">
          <button
            className="history-toggle-button"
            onClick={() => setShowHistory(!showHistory)}
            title={showHistory ? "Hide History" : "Show History"}
          >
            {showHistory ? '◀' : '▶'} History ({requestHistory.length})
          </button>
          <button className="save-api-button" onClick={handleSave}>
            Save API
          </button>
        </div>
      </div>

      <div className="api-tester-layout">
        {/* History Panel */}
        {showHistory && (
          <div className="history-panel">
            <div className="history-header">
              <h3>Request History</h3>
              <button className="clear-history-button" onClick={clearHistory}>
                Clear All
              </button>
            </div>
            
            <div className="history-list">
              {requestHistory.length === 0 ? (
                <div className="history-empty">
                  <p>No requests yet</p>
                  <p className="history-hint">Send an API request to see it here</p>
                </div>
              ) : (
                requestHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`history-item ${selectedHistoryItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => loadHistoryItem(item)}
                  >
                    <div className="history-item-header">
                      <span className={`history-method method-${item.method.toLowerCase()}`}>
                        {item.method}
                      </span>
                      <span
                        className="history-status"
                        style={{
                          color: item.success ? getStatusColor(item.status) : '#ef4444'
                        }}
                      >
                        {item.success ? item.status : 'Error'}
                      </span>
                    </div>
                    <div className="history-url" title={item.url}>
                      {item.url}
                    </div>
                    <div className="history-meta">
                      <span className="history-time">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="history-duration">
                        {item.duration}ms
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="api-tester-main">
          <div className="request-section">
        <div className="request-line">
          <select
            className="method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          
          <input
            type="text"
            className="url-input"
            placeholder="Enter request URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          
          <button 
            className="send-button"
            onClick={handleSend}
            disabled={sendRequestMutation.isPending}
          >
            {sendRequestMutation.isPending ? 'Sending...' : 'Send'}
          </button>
        </div>

        <div className="request-tabs">
          <button
            className={`tab ${activeTab === 'auth' ? 'active' : ''}`}
            onClick={() => setActiveTab('auth')}
          >
            Authorization
          </button>
          <button
            className={`tab ${activeTab === 'headers' ? 'active' : ''}`}
            onClick={() => setActiveTab('headers')}
          >
            Headers ({headers.filter(h => h.enabled && h.key).length})
          </button>
          <button
            className={`tab ${activeTab === 'body' ? 'active' : ''}`}
            onClick={() => setActiveTab('body')}
          >
            Body
          </button>
        </div>

        <div className="request-content">
          {activeTab === 'auth' && (
            <div className="auth-section">
              <div className="form-group">
                <label>Auth Type</label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value)}
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>

              {authType === 'bearer' && (
                <div className="form-group">
                  <label>Token</label>
                  <input
                    type="text"
                    placeholder="Enter bearer token"
                    value={authConfig.token}
                    onChange={(e) => setAuthConfig({...authConfig, token: e.target.value})}
                  />
                </div>
              )}

              {authType === 'basic' && (
                <>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      placeholder="Enter username"
                      value={authConfig.username}
                      onChange={(e) => setAuthConfig({...authConfig, username: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter password"
                      value={authConfig.password}
                      onChange={(e) => setAuthConfig({...authConfig, password: e.target.value})}
                    />
                  </div>
                </>
              )}

              {authType === 'apikey' && (
                <>
                  <div className="form-group">
                    <label>Header Name</label>
                    <input
                      type="text"
                      placeholder="e.g., X-API-Key"
                      value={authConfig.apiKeyHeader}
                      onChange={(e) => setAuthConfig({...authConfig, apiKeyHeader: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>API Key</label>
                    <input
                      type="text"
                      placeholder="Enter API key"
                      value={authConfig.apiKey}
                      onChange={(e) => setAuthConfig({...authConfig, apiKey: e.target.value})}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'headers' && (
            <div className="headers-section">
              <div className="headers-list">
                {headers.map((header, index) => (
                  <div key={index} className="header-row">
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                    />
                    <input
                      type="text"
                      placeholder="Header name"
                      value={header.key}
                      onChange={(e) => updateHeader(index, 'key', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={header.value}
                      onChange={(e) => updateHeader(index, 'value', e.target.value)}
                    />
                    <button
                      className="remove-button"
                      onClick={() => removeHeader(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button className="add-button" onClick={addHeader}>
                + Add Header
              </button>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="body-section">
              <div className="body-type-selector">
                <label>
                  <input
                    type="radio"
                    value="json"
                    checked={bodyType === 'json'}
                    onChange={(e) => setBodyType(e.target.value)}
                  />
                  JSON
                </label>
                <label>
                  <input
                    type="radio"
                    value="xml"
                    checked={bodyType === 'xml'}
                    onChange={(e) => setBodyType(e.target.value)}
                  />
                  XML
                </label>
                <label>
                  <input
                    type="radio"
                    value="text"
                    checked={bodyType === 'text'}
                    onChange={(e) => setBodyType(e.target.value)}
                  />
                  Text
                </label>
              </div>
              <textarea
                className="body-textarea"
                placeholder={`Enter ${bodyType.toUpperCase()} body`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
              />
              {!['POST', 'PUT', 'PATCH'].includes(method) && (
                <p className="body-disabled-message">
                  Request body is not supported for {method} requests
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {response && (
        <div className="response-section">
          <div className="response-header">
            <div className="response-status">
              <span 
                className="status-badge"
                style={{ backgroundColor: response.success ? getStatusColor(response.status) : '#ef4444' }}
              >
                {response.success ? `${response.status} ${response.statusText}` : 'Error'}
              </span>
              {response.duration && (
                <span className="response-time">{response.duration}ms</span>
              )}
              {response.size && (
                <span className="response-size">{(response.size / 1024).toFixed(2)} KB</span>
              )}
            </div>
          </div>

          <div className="response-tabs">
            <button
              className={`tab ${responseTab === 'body' ? 'active' : ''}`}
              onClick={() => setResponseTab('body')}
            >
              Body
            </button>
            <button
              className={`tab ${responseTab === 'headers' ? 'active' : ''}`}
              onClick={() => setResponseTab('headers')}
            >
              Headers
            </button>
          </div>

          <div className="response-content">
            {responseTab === 'body' && (
              <pre className="response-body">
                {response.success 
                  ? formatJson(response.data)
                  : response.error
                }
              </pre>
            )}

            {responseTab === 'headers' && response.success && (
              <div className="response-headers">
                {Object.entries(response.headers).map(([key, value]) => (
                  <div key={key} className="header-item">
                    <span className="header-key">{key}:</span>
                    <span className="header-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Save API Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Save API</h2>
              <button className="modal-close" onClick={() => setShowSaveModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>API Name</label>
                <input
                  type="text"
                  placeholder="Enter API name (optional)"
                  value={saveConfig.apiName}
                  onChange={(e) => setSaveConfig({...saveConfig, apiName: e.target.value})}
                />
                <small>Default: {method} {url}</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveConfig.createNewGroup}
                    onChange={(e) => setSaveConfig({
                      ...saveConfig,
                      createNewGroup: e.target.checked,
                      selectedGroupId: e.target.checked ? '' : saveConfig.selectedGroupId
                    })}
                  />
                  Create New Group
                </label>
              </div>

              {saveConfig.createNewGroup ? (
                <div className="form-group">
                  <label>New Group Name *</label>
                  <input
                    type="text"
                    placeholder="Enter group name"
                    value={saveConfig.newGroupName}
                    onChange={(e) => setSaveConfig({...saveConfig, newGroupName: e.target.value})}
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label>Select Group *</label>
                  <select
                    value={saveConfig.selectedGroupId}
                    onChange={(e) => setSaveConfig({...saveConfig, selectedGroupId: e.target.value})}
                  >
                    <option value="">-- Select a group --</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {groups.length === 0 && (
                    <small className="text-warning">No groups available. Create a new group instead.</small>
                  )}
                </div>
              )}

              <div className="api-preview">
                <h4>API Configuration Preview</h4>
                <div className="preview-item">
                  <strong>Method:</strong> {method}
                </div>
                <div className="preview-item">
                  <strong>URL:</strong> {url}
                </div>
                <div className="preview-item">
                  <strong>Auth:</strong> {authType === 'none' ? 'None' : authType.toUpperCase()}
                </div>
                <div className="preview-item">
                  <strong>Headers:</strong> {headers.filter(h => h.enabled && h.key).length} custom header(s)
                </div>
                {body && (
                  <div className="preview-item">
                    <strong>Body:</strong> {bodyType.toUpperCase()} ({body.length} characters)
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveSubmit}
                disabled={saveApiMutation.isPending}
              >
                {saveApiMutation.isPending ? 'Saving...' : 'Save API'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTester;

// Made with Bob
