import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiGroupService, apiNodeService } from '../services/api';
import CollectionsSidebar from './CollectionsSidebar';
import JsonViewer from './JsonViewer';
import JsonEditor from './JsonEditor';
import './ApiTesterRefactored.css';

const ApiTesterRefactored = () => {
  const queryClient = useQueryClient();
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
  const [variables, setVariables] = useState([{ name: '', jsonPath: '', value: '' }]);
  const [extractedVariables, setExtractedVariables] = useState({});
  const [currentRequest, setCurrentRequest] = useState(null);
  const [currentHistoryItem, setCurrentHistoryItem] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSaveToCollectionModal, setShowSaveToCollectionModal] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveConfig, setSaveConfig] = useState({
    apiName: '',
    selectedGroupId: '',
    newGroupName: '',
    createNewGroup: false
  });
  const [collectionSaveConfig, setCollectionSaveConfig] = useState({
    requestName: '',
    selectedCollectionId: '',
    selectedFolderId: '',
    newCollectionName: '',
    createNewCollection: false
  });
  const [saveAsConfig, setSaveAsConfig] = useState({
    requestName: '',
    selectedCollectionId: '',
    selectedFolderId: '',
    newCollectionName: '',
    createNewCollection: false
  });

  // Fetch all groups for the save modal
  const { data: groups = [] } = useQuery({
    queryKey: ['apiGroups'],
    queryFn: async () => {
      const response = await apiGroupService.getAll();
      return response.data;
    }
  });

  // Fetch all collections for the save to collection modal
  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await axios.get('/api/collections');
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
    onSuccess: async (data) => {
      setResponse({
        success: true,
        ...data
      });
      
      // Extract variables from response
      extractVariablesFromResponse(data.data);
      
      // Save to API-level history if we have a current request
      if (currentRequest?.id) {
        try {
          await axios.post(`/api/history/request/${currentRequest.id}`, {
            method,
            url,
            requestHeaders: JSON.stringify(buildHeaders()),
            requestBody: body || null,
            responseStatus: data.status,
            responseStatusText: data.statusText,
            responseHeaders: JSON.stringify(data.headers),
            responseBody: JSON.stringify(data.data),
            durationMs: data.duration,
            responseSize: data.size,
            success: true,
            errorMessage: null
          });
        } catch (error) {
          console.error('Failed to save history:', error);
        }
      }
    },
    onError: async (error) => {
      setResponse({
        success: false,
        error: error.message,
        duration: error.duration
      });
      
      // Save failed request to history
      if (currentRequest?.id) {
        try {
          await axios.post(`/api/history/request/${currentRequest.id}`, {
            method,
            url,
            requestHeaders: JSON.stringify(buildHeaders()),
            requestBody: body || null,
            responseStatus: null,
            responseStatusText: 'Error',
            responseHeaders: null,
            responseBody: null,
            durationMs: error.duration,
            responseSize: null,
            success: false,
            errorMessage: error.message
          });
        } catch (err) {
          console.error('Failed to save error history:', err);
        }
      }
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

  const handleSaveToCollection = () => {
    if (!url) {
      alert('Please configure an API request before saving');
      return;
    }
    setShowSaveToCollectionModal(true);
  };

  const handleSaveAs = () => {
    if (!currentRequest) {
      alert('Please select a saved API request first');
      return;
    }
    setSaveAsConfig({
      requestName: currentRequest.name || '',
      selectedCollectionId: '',
      selectedFolderId: '',
      newCollectionName: '',
      createNewCollection: false
    });
    setShowSaveAsModal(true);
  };

  const saveApiMutation = useMutation({
    mutationFn: async () => {
      try {
        let groupId = saveConfig.selectedGroupId;

        // Create new group if needed
        if (saveConfig.createNewGroup) {
          if (!saveConfig.newGroupName.trim()) {
            throw new Error('Please enter a group name');
          }
          const groupResponse = await apiGroupService.create({
            name: saveConfig.newGroupName,
            description: `Created from API Tester`
          });
          groupId = groupResponse.data.id;
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

        // Prepare field mappings from variables
        const fieldMappings = {};
        variables.forEach(variable => {
          if (variable.name && variable.jsonPath) {
            fieldMappings[variable.name] = variable.jsonPath;
          }
        });

        // Create API node
        const nodeData = {
          name: saveConfig.apiName || `${method} ${url}`,
          method: method,
          url: url,
          headers: JSON.stringify(headersObj),
          requestBody: body || null,
          sequenceOrder: null,
          fieldMappings: fieldMappings
        };

        const response = await apiNodeService.create(groupId, nodeData);
        return { groupId, nodeId: response.data.id };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      alert(`API saved successfully to group!`);
      setShowSaveModal(false);
      setSaveConfig({
        apiName: '',
        selectedGroupId: '',
        newGroupName: '',
        createNewGroup: false
      });
    },
    onError: (error) => {
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        errorMessage = error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Failed to save API: ${errorMessage}`);
    }
  });

  const handleSaveSubmit = () => {
    saveApiMutation.mutate();
  };

  const saveToCollectionMutation = useMutation({
    mutationFn: async () => {
      try {
        let collectionId = collectionSaveConfig.selectedCollectionId;

        // Create new collection if needed
        if (collectionSaveConfig.createNewCollection) {
          if (!collectionSaveConfig.newCollectionName.trim()) {
            throw new Error('Please enter a collection name');
          }
          const collectionResponse = await axios.post('/api/collections', {
            name: collectionSaveConfig.newCollectionName,
            description: 'Created from API Tester'
          });
          collectionId = collectionResponse.data.id;
        } else if (!collectionId) {
          throw new Error('Please select a collection or create a new one');
        }

        // Prepare headers object
        const headersObj = {};
        headers.forEach(header => {
          if (header.enabled && header.key && header.value) {
            headersObj[header.key] = header.value;
          }
        });

        // Create request in collection
        const folderId = collectionSaveConfig.selectedFolderId;
        const url_path = folderId
          ? `/api/collections/${collectionId}/requests?folderId=${folderId}`
          : `/api/collections/${collectionId}/requests`;
        
        const requestData = {
          name: collectionSaveConfig.requestName || `${method} ${url}`,
          method: method,
          url: url,
          headers: JSON.stringify(headersObj),
          requestBody: body || null
        };

        const response = await axios.post(url_path, requestData);
        return { collectionId, requestId: response.data.id };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      alert(`API saved successfully to collection!`);
      setShowSaveToCollectionModal(false);
      setCollectionSaveConfig({
        requestName: '',
        selectedCollectionId: '',
        selectedFolderId: '',
        newCollectionName: '',
        createNewCollection: false
      });
      // Refresh collections
      queryClient.invalidateQueries(['collections']);
    },
    onError: (error) => {
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        errorMessage = error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Failed to save API: ${errorMessage}`);
    }
  });

  const handleSaveToCollectionSubmit = () => {
    saveToCollectionMutation.mutate();
  };

  const saveAsMutation = useMutation({
    mutationFn: async () => {
      try {
        let targetCollectionId = saveAsConfig.selectedCollectionId;

        // Create new collection if needed
        if (saveAsConfig.createNewCollection) {
          if (!saveAsConfig.newCollectionName.trim()) {
            throw new Error('Please enter a collection name');
          }
          const collectionResponse = await axios.post('/api/collections', {
            name: saveAsConfig.newCollectionName,
            description: 'Created from Save As'
          });
          targetCollectionId = collectionResponse.data.id;
        } else if (!targetCollectionId) {
          throw new Error('Please select a target collection or create a new one');
        }

        const targetFolderId = saveAsConfig.selectedFolderId || null;
        
        // Move the request
        const moveUrl = `/api/collections/requests/${currentRequest.id}/move?targetCollectionId=${targetCollectionId}${targetFolderId ? `&targetFolderId=${targetFolderId}` : ''}`;
        await axios.put(moveUrl);
        
        // Update the request name if changed
        if (saveAsConfig.requestName && saveAsConfig.requestName !== currentRequest.name) {
          const updateUrl = `/api/collections/requests/${currentRequest.id}`;
          await axios.put(updateUrl, {
            ...currentRequest,
            name: saveAsConfig.requestName
          });
        }
        
        return { targetCollectionId };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: (data) => {
      alert(`API saved successfully to new location!`);
      setShowSaveAsModal(false);
      setSaveAsConfig({
        requestName: '',
        selectedCollectionId: '',
        selectedFolderId: '',
        newCollectionName: '',
        createNewCollection: false
      });
      // Refresh collections
      queryClient.invalidateQueries(['collections']);
      // Clear current request since it's been moved
      setCurrentRequest(null);
    },
    onError: (error) => {
      let errorMessage = 'Unknown error occurred';
      
      if (error.response) {
        errorMessage = error.response.data?.message ||
                      error.response.data?.error ||
                      `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        errorMessage = error.message;
      }
      
      alert(`Failed to save API: ${errorMessage}`);
    }
  });

  const handleSaveAsSubmit = () => {
    saveAsMutation.mutate();
  };

  const handleSelectRequest = (request, historyItem = null) => {
    setCurrentRequest(request);
    setCurrentHistoryItem(historyItem);
    
    if (historyItem) {
      // Load from history
      setMethod(historyItem.method);
      setUrl(historyItem.url);
      setBody(historyItem.requestBody || '');
      
      // Parse and set headers from history
      try {
        const historyHeaders = JSON.parse(historyItem.requestHeaders || '{}');
        const headerArray = Object.entries(historyHeaders).map(([key, value]) => ({
          key,
          value,
          enabled: true
        }));
        setHeaders(headerArray.length > 0 ? headerArray : [{ key: '', value: '', enabled: true }]);
      } catch (e) {
        setHeaders([{ key: '', value: '', enabled: true }]);
      }
      
      // Set response from history
      if (historyItem.success) {
        try {
          const responseData = JSON.parse(historyItem.responseBody || '{}');
          const responseHeaders = JSON.parse(historyItem.responseHeaders || '{}');
          setResponse({
            success: true,
            status: historyItem.responseStatus,
            statusText: historyItem.responseStatusText,
            headers: responseHeaders,
            data: responseData,
            duration: historyItem.durationMs,
            size: historyItem.responseSize
          });
        } catch (e) {
          console.error('Failed to parse history response:', e);
        }
      } else {
        setResponse({
          success: false,
          error: historyItem.errorMessage,
          duration: historyItem.durationMs
        });
      }
    } else {
      // Load from saved request
      setMethod(request.method);
      setUrl(request.url);
      setBody(request.requestBody || '');
      
      // Parse and set headers
      try {
        const requestHeaders = JSON.parse(request.headers || '{}');
        const headerArray = Object.entries(requestHeaders).map(([key, value]) => ({
          key,
          value,
          enabled: true
        }));
        setHeaders(headerArray.length > 0 ? headerArray : [{ key: '', value: '', enabled: true }]);
      } catch (e) {
        setHeaders([{ key: '', value: '', enabled: true }]);
      }
      
      // Parse and set field mappings as variables
      if (request.fieldMappings && Object.keys(request.fieldMappings).length > 0) {
        const variableArray = Object.entries(request.fieldMappings).map(([name, jsonPath]) => ({
          name,
          jsonPath,
          value: ''
        }));
        setVariables(variableArray.length > 0 ? variableArray : [{ name: '', jsonPath: '', value: '' }]);
      } else {
        setVariables([{ name: '', jsonPath: '', value: '' }]);
      }
      
      // Clear response when loading a new request
      setResponse(null);
    }
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
          <p>Test your APIs with Postman-style organization</p>
        </div>
        <div className="header-actions">
          <button
            className="save-api-button"
            onClick={handleSaveAs}
            disabled={!currentRequest}
            title={!currentRequest ? "Select a saved request first" : "Save this request to another collection/folder"}
          >
            Save As
          </button>
          <button className="save-api-button" onClick={handleSaveToCollection}>
            Save API to Collection
          </button>
          <button className="save-api-button" onClick={handleSave}>
            Save API to Group
          </button>
        </div>
      </div>

      <div className="api-tester-layout">
        {/* Collections Sidebar */}
        <CollectionsSidebar 
          onSelectRequest={handleSelectRequest}
          selectedRequestId={currentRequest?.id}
        />

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
                  {bodyType === 'json' ? (
                    <JsonEditor
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Enter JSON body"
                      disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
                      className="body-textarea"
                    />
                  ) : (
                    <textarea
                      className="body-textarea"
                      placeholder={`Enter ${bodyType.toUpperCase()} body`}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      disabled={!['POST', 'PUT', 'PATCH'].includes(method)}
                    />
                  )}
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
                  response.success ? (
                    <JsonViewer data={response.data} className="response-body" />
                  ) : (
                    <pre className="response-body error">
                      {response.error}
                    </pre>
                  )
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
              <h2>Save API to Group</h2>
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

      {/* Save API to Collection Modal */}
      {showSaveToCollectionModal && (
        <div className="modal-overlay" onClick={() => setShowSaveToCollectionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Save API to Collection</h2>
              <button className="modal-close" onClick={() => setShowSaveToCollectionModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Request Name</label>
                <input
                  type="text"
                  placeholder="Enter request name (optional)"
                  value={collectionSaveConfig.requestName}
                  onChange={(e) => setCollectionSaveConfig({...collectionSaveConfig, requestName: e.target.value})}
                />
                <small>Default: {method} {url}</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={collectionSaveConfig.createNewCollection}
                    onChange={(e) => setCollectionSaveConfig({
                      ...collectionSaveConfig,
                      createNewCollection: e.target.checked,
                      selectedCollectionId: e.target.checked ? '' : collectionSaveConfig.selectedCollectionId,
                      selectedFolderId: ''
                    })}
                  />
                  Create New Collection
                </label>
              </div>

              {collectionSaveConfig.createNewCollection ? (
                <div className="form-group">
                  <label>New Collection Name *</label>
                  <input
                    type="text"
                    placeholder="Enter collection name"
                    value={collectionSaveConfig.newCollectionName}
                    onChange={(e) => setCollectionSaveConfig({...collectionSaveConfig, newCollectionName: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Select Collection *</label>
                    <select
                      value={collectionSaveConfig.selectedCollectionId}
                      onChange={(e) => setCollectionSaveConfig({
                        ...collectionSaveConfig, 
                        selectedCollectionId: e.target.value,
                        selectedFolderId: ''
                      })}
                    >
                      <option value="">-- Select a collection --</option>
                      {collections.map(collection => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                    {collections.length === 0 && (
                      <small className="text-warning">No collections available. Create a new collection instead.</small>
                    )}
                  </div>

                  {collectionSaveConfig.selectedCollectionId && (
                    <div className="form-group">
                      <label>Select Folder (Optional)</label>
                      <select
                        value={collectionSaveConfig.selectedFolderId}
                        onChange={(e) => setCollectionSaveConfig({...collectionSaveConfig, selectedFolderId: e.target.value})}
                      >
                        <option value="">-- Save to collection root --</option>
                        {collections
                          .find(c => c.id === parseInt(collectionSaveConfig.selectedCollectionId))
                          ?.folders?.map(folder => (
                            <option key={folder.id} value={folder.id}>
                              📁 {folder.name}
                            </option>
                          ))}
                      </select>
                      <small>Leave empty to save at collection level</small>
                    </div>
                  )}
                </>
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
                onClick={() => setShowSaveToCollectionModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveToCollectionSubmit}
                disabled={saveToCollectionMutation.isPending}
              >
                {saveToCollectionMutation.isPending ? 'Saving...' : 'Save to Collection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="modal-overlay" onClick={() => setShowSaveAsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Save Request</h2>
              <button className="modal-close" onClick={() => setShowSaveAsModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="info-message">
                <p>Save "{currentRequest?.name}" to a different location or rename it.</p>
              </div>

              <div className="form-group">
                <label>Request Name</label>
                <input
                  type="text"
                  placeholder="Enter request name"
                  value={saveAsConfig.requestName}
                  onChange={(e) => setSaveAsConfig({...saveAsConfig, requestName: e.target.value})}
                />
                <small>Update the name of this request</small>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={saveAsConfig.createNewCollection}
                    onChange={(e) => setSaveAsConfig({
                      ...saveAsConfig,
                      createNewCollection: e.target.checked,
                      selectedCollectionId: e.target.checked ? '' : saveAsConfig.selectedCollectionId,
                      selectedFolderId: ''
                    })}
                  />
                  Create New Collection
                </label>
              </div>

              {saveAsConfig.createNewCollection ? (
                <div className="form-group">
                  <label>New Collection Name *</label>
                  <input
                    type="text"
                    placeholder="Enter collection name"
                    value={saveAsConfig.newCollectionName}
                    onChange={(e) => setSaveAsConfig({...saveAsConfig, newCollectionName: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Target Collection *</label>
                    <select
                      value={saveAsConfig.selectedCollectionId}
                      onChange={(e) => setSaveAsConfig({
                        ...saveAsConfig,
                        selectedCollectionId: e.target.value,
                        selectedFolderId: ''
                      })}
                    >
                      <option value="">-- Select a collection --</option>
                      {collections.map(collection => (
                        <option key={collection.id} value={collection.id}>
                          {collection.name}
                        </option>
                      ))}
                    </select>
                    {collections.length === 0 && (
                      <small className="text-warning">No collections available. Create a new collection instead.</small>
                    )}
                  </div>

                  {saveAsConfig.selectedCollectionId && (
                    <div className="form-group">
                      <label>Target Folder (Optional)</label>
                      <select
                        value={saveAsConfig.selectedFolderId}
                        onChange={(e) => setSaveAsConfig({...saveAsConfig, selectedFolderId: e.target.value})}
                      >
                        <option value="">-- Save to collection root --</option>
                        {collections
                          .find(c => c.id === parseInt(saveAsConfig.selectedCollectionId))
                          ?.folders?.map(folder => (
                            <option key={folder.id} value={folder.id}>
                              📁 {folder.name}
                            </option>
                          ))}
                      </select>
                      <small>Leave empty to save at collection root level</small>
                    </div>
                  )}
                </>
              )}

              <div className="api-preview">
                <h4>Request Details</h4>
                <div className="preview-item">
                  <strong>Method:</strong> {currentRequest?.method}
                </div>
                <div className="preview-item">
                  <strong>URL:</strong> {currentRequest?.url}
                </div>
                <div className="preview-item">
                  <strong>Current Location:</strong> {currentRequest?.collection?.name}
                  {currentRequest?.folder && ` / ${currentRequest.folder.name}`}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowSaveAsModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveAsSubmit}
                disabled={saveAsMutation.isPending || (!saveAsConfig.createNewCollection && !saveAsConfig.selectedCollectionId)}
              >
                {saveAsMutation.isPending ? 'Saving...' : 'Save Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTesterRefactored;

// Made with Bob