import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Play, Save, Settings, Trash2, Upload, X, ArrowUp, ArrowDown } from 'lucide-react';
import BulkTestingWorkflow from './BulkTestingWorkflow';
import './VisualNodeEditor.css';

const VisualNodeEditor = ({ groupId, nodes: apiNodes = [], onExecute, onSave, latestRun }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showBatchExecutor, setShowBatchExecutor] = useState(false);
  const [showAddVariableForm, setShowAddVariableForm] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: '', path: '' });
  const [nodeConfig, setNodeConfig] = useState({
    name: '',
    method: 'GET',
    url: '',
    headers: '{}',
    requestBody: '',
    exportResponse: false,
    fieldMappings: {}
  });

  // Convert API nodes to React Flow nodes
  useEffect(() => {
    if (apiNodes && apiNodes.length > 0) {
      const flowNodes = apiNodes.map((node, index) => ({
        id: String(node.id),
        type: 'default',
        position: { x: 100, y: 100 + (index * 150) },
        data: {
          label: (
            <div className="custom-node">
              <div className="node-header">
                <span className={`method-badge method-${node.method.toLowerCase()}`}>
                  {node.method}
                </span>
                <span className="node-name">{node.name}</span>
              </div>
              <div className="node-url">{node.url}</div>
              <div className="node-actions">
                <button
                  className="node-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveNode(node.id, 'up');
                  }}
                  title="Move Up"
                  disabled={index === 0}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  className="node-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveNode(node.id, 'down');
                  }}
                  title="Move Down"
                  disabled={index === apiNodes.length - 1}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  className="node-action-btn"
                  onClick={() => handleEditNode(node)}
                  title="Edit"
                >
                  <Settings size={14} />
                </button>
                <button
                  className="node-action-btn delete"
                  onClick={() => handleDeleteNode(node.id)}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ),
          apiNode: node
        },
        style: {
          background: '#fff',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          padding: '10px',
          width: 280,
        }
      }));

      // Create edges based on sequence order
      const flowEdges = [];
      for (let i = 0; i < flowNodes.length - 1; i++) {
        flowEdges.push({
          id: `e${flowNodes[i].id}-${flowNodes[i + 1].id}`,
          source: flowNodes[i].id,
          target: flowNodes[i + 1].id,
          type: 'smoothstep',
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
          style: { stroke: '#3b82f6', strokeWidth: 2 }
        });
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [apiNodes, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = () => {
    setNodeConfig({
      name: '',
      method: 'GET',
      url: '',
      headers: '{}',
      requestBody: '',
      exportResponse: false,
      fieldMappings: {}
    });
    setSelectedNode(null);
    setShowConfigModal(true);
  };

  const handleEditNode = (node) => {
    setSelectedNode(node);
    
    console.log('=== Edit Node Debug ===');
    console.log('Node:', node);
    console.log('Node ID:', node.id);
    console.log('Field Mappings:', node.fieldMappings);
    console.log('Latest Run:', latestRun);
    
    // Extract values from latest run for this specific node
    const extractedValues = {};
    if (latestRun && latestRun.apiRunResults) {
      console.log('API Run Results:', latestRun.apiRunResults);
      const nodeResult = latestRun.apiRunResults.find(r => r.apiNodeId === node.id);
      console.log('Node Result for ID', node.id, ':', nodeResult);
      
      if (nodeResult && nodeResult.response) {
        try {
          const responseData = JSON.parse(nodeResult.response);
          console.log('Response Data:', responseData);
          
          if (node.fieldMappings) {
            Object.entries(node.fieldMappings).forEach(([varName, jsonPath]) => {
              console.log(`Extracting ${varName} from path ${jsonPath}`);
              const value = extractValueFromJsonPath(responseData, jsonPath);
              console.log(`Extracted value for ${varName}:`, value);
              if (value !== null && value !== undefined) {
                extractedValues[varName] = value;
              }
            });
          }
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      } else {
        console.log('No node result or response found');
      }
    } else {
      console.log('No latest run or apiRunResults');
    }
    
    console.log('Final Extracted Values:', extractedValues);
    console.log('=== End Debug ===');
    
    setNodeConfig({
      name: node.name,
      method: node.method,
      url: node.url,
      headers: node.headers || '{}',
      requestBody: node.requestBody || '',
      exportResponse: node.exportResponse || false,
      fieldMappings: node.fieldMappings || {},
      extractedValues: extractedValues
    });
    setShowConfigModal(true);
  };

  // Helper function to extract value from JSON using path
  const extractValueFromJsonPath = (obj, path) => {
    if (!path || !obj) return null;
    
    // Remove leading $ or $. if present
    const cleanPath = path.replace(/^\$\.?/, '');
    const parts = cleanPath.split('.');
    
    let current = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return null;
      current = current[part];
    }
    
    return current;
  };

  const handleAddFieldMapping = () => {
    setShowAddVariableForm(true);
    setNewVariable({ name: '', path: '' });
  };

  const handleSaveNewVariable = () => {
    if (newVariable.name.trim() && newVariable.path.trim()) {
      setNodeConfig({
        ...nodeConfig,
        fieldMappings: {
          ...nodeConfig.fieldMappings,
          [newVariable.name.trim()]: newVariable.path.trim()
        }
      });
      setShowAddVariableForm(false);
      setNewVariable({ name: '', path: '' });
    }
  };

  const handleCancelNewVariable = () => {
    setShowAddVariableForm(false);
    setNewVariable({ name: '', path: '' });
  };

  const handleRemoveFieldMapping = (varName) => {
    const newMappings = { ...nodeConfig.fieldMappings };
    delete newMappings[varName];
    setNodeConfig({
      ...nodeConfig,
      fieldMappings: newMappings
    });
  };

  const handleMoveNode = (nodeId, direction) => {
    console.log('=== handleMoveNode called ===');
    console.log('nodeId:', nodeId, 'direction:', direction);
    console.log('groupId:', groupId);
    console.log('apiNodes:', apiNodes);
    
    const currentIndex = apiNodes.findIndex(n => n.id === nodeId);
    if (currentIndex === -1) {
      console.error('Node not found in apiNodes');
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= apiNodes.length) {
      console.log('Cannot move - at boundary');
      return;
    }

    // Create new order array
    const newOrder = [...apiNodes];
    const [movedNode] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, movedNode);

    // Update sequence orders
    const nodeIds = newOrder.map(n => n.id);
    console.log('New order nodeIds:', nodeIds);
    
    // Call API to reorder
    if (onSave) {
      console.log('Calling onSave with reorder action');
      onSave({
        action: 'reorder',
        nodeIds: nodeIds,
        groupId: groupId
      });
    } else {
      console.error('onSave is not defined');
    }
  };

  const handleDeleteNode = (nodeId) => {
    if (window.confirm('Are you sure you want to delete this API node?')) {
      // Call parent component to delete via API
      if (onSave) {
        onSave({ action: 'delete', nodeId });
      }
    }
  };

  const handleSaveNode = () => {
    if (!nodeConfig.name || !nodeConfig.url) {
      alert('Please fill in required fields (Name and URL)');
      return;
    }

    // Prepare node data, excluding UI-only fields like extractedValues
    const { extractedValues, ...nodeDataToSave } = nodeConfig;
    
    const nodeData = {
      ...nodeDataToSave,
      sequenceOrder: selectedNode?.sequenceOrder || null // Let backend assign sequence order
    };

    if (onSave) {
      onSave({
        action: selectedNode ? 'update' : 'create',
        nodeData,
        nodeId: selectedNode?.id
      });
    }

    setShowConfigModal(false);
  };

  const handleExecuteFlow = () => {
    if (onExecute) {
      onExecute(groupId);
    }
  };

  return (
    <div className="visual-node-editor">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <h3>Visual Flow Editor</h3>
          <span className="node-count">{nodes.length} API(s)</span>
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn" onClick={handleAddNode}>
            <Plus size={18} />
            Add API Node
          </button>
          <button className="toolbar-btn" onClick={() => setShowBatchExecutor(true)}>
            <Upload size={18} />
            Bulk Testing
          </button>
          <button className="toolbar-btn primary" onClick={handleExecuteFlow}>
            <Play size={18} />
            Execute Flow
          </button>
        </div>
      </div>

      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Node Configuration Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedNode ? 'Edit API Node' : 'Add API Node'}</h2>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Display API Request Info when editing */}
              {selectedNode && (
                <div className="api-request-info">
                  <h3>API Request Details</h3>
                  <div className="request-detail">
                    <span className="detail-label">Method:</span>
                    <span className={`method-badge method-${selectedNode.method.toLowerCase()}`}>
                      {selectedNode.method}
                    </span>
                  </div>
                  <div className="request-detail">
                    <span className="detail-label">URL:</span>
                    <code className="detail-value">{selectedNode.url}</code>
                  </div>
                  {selectedNode.headers && selectedNode.headers !== '{}' && (
                    <div className="request-detail">
                      <span className="detail-label">Headers:</span>
                      <pre className="detail-value">{selectedNode.headers}</pre>
                    </div>
                  )}
                  {selectedNode.requestBody && (
                    <div className="request-detail">
                      <span className="detail-label">Request Body:</span>
                      <pre className="detail-value">{selectedNode.requestBody}</pre>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>API Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Create User"
                  value={nodeConfig.name}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Method *</label>
                  <select
                    value={nodeConfig.method}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, method: e.target.value })}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="form-group flex-grow">
                  <label>URL *</label>
                  <input
                    type="text"
                    placeholder="https://api.example.com/endpoint"
                    value={nodeConfig.url}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, url: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Headers (JSON)</label>
                <textarea
                  rows="4"
                  placeholder='{"Content-Type": "application/json"}'
                  value={nodeConfig.headers}
                  onChange={(e) => setNodeConfig({ ...nodeConfig, headers: e.target.value })}
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(nodeConfig.method) && (
                <div className="form-group">
                  <label>Request Body</label>
                  <textarea
                    rows="6"
                    placeholder='{"key": "value"}'
                    value={nodeConfig.requestBody}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, requestBody: e.target.value })}
                  />
                </div>
              )}

              {/* Field Mappings Section */}
              <div className="form-group">
                <div className="field-mappings-header">
                  <label>Response Data Variables</label>
                  <button
                    type="button"
                    className="btn-add-mapping"
                    onClick={handleAddFieldMapping}
                  >
                    <Plus size={16} />
                    Add Variable
                  </button>
                </div>
                <p className="field-help-text">
                  Extract values from API response and save them as variables for use in subsequent API calls.
                  {selectedNode && Object.keys(nodeConfig.fieldMappings).length > 0 && !nodeConfig.extractedValues && (
                    <span className="execution-note"> Execute the flow to see extracted values.</span>
                  )}
                </p>
                
                {/* Add Variable Form */}
                {showAddVariableForm && (
                  <div className="add-variable-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Variable Name *</label>
                        <input
                          type="text"
                          placeholder="e.g., PRODUCT_ID, USER_TOKEN"
                          value={newVariable.name}
                          onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                          autoFocus
                        />
                      </div>
                      <div className="form-group flex-grow">
                        <label>JSON Path *</label>
                        <input
                          type="text"
                          placeholder="e.g., id, data.user.id, response.token"
                          value={newVariable.path}
                          onChange={(e) => setNewVariable({ ...newVariable, path: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary-small"
                        onClick={handleCancelNewVariable}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary-small"
                        onClick={handleSaveNewVariable}
                        disabled={!newVariable.name.trim() || !newVariable.path.trim()}
                      >
                        Save Variable
                      </button>
                    </div>
                  </div>
                )}

                {Object.keys(nodeConfig.fieldMappings).length === 0 && !showAddVariableForm ? (
                  <div className="no-mappings">
                    No variables configured. Click "Add Variable" to extract data from the response.
                  </div>
                ) : (
                  <div className="field-mappings-list">
                    {Object.entries(nodeConfig.fieldMappings).map(([varName, jsonPath]) => {
                      const extractedValue = nodeConfig.extractedValues?.[varName];
                      const hasValue = extractedValue !== null && extractedValue !== undefined;
                      
                      return (
                        <div key={varName} className="field-mapping-item">
                          <div className="mapping-info">
                            <span className="mapping-var">
                              <code>{varName}</code>
                            </span>
                            <span className="mapping-arrow">→</span>
                            <span className="mapping-path">
                              <code>{jsonPath}</code>
                            </span>
                            {hasValue && (
                              <>
                                <span className="mapping-arrow">→</span>
                                <span className="mapping-value">
                                  <code>{typeof extractedValue === 'object' ? JSON.stringify(extractedValue) : String(extractedValue)}</code>
                                </span>
                              </>
                            )}
                          </div>
                          <button
                            type="button"
                            className="btn-remove-mapping"
                            onClick={() => handleRemoveFieldMapping(varName)}
                            title="Remove variable"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowConfigModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSaveNode}>
                <Save size={18} />
                {selectedNode ? 'Update Node' : 'Add Node'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Testing Workflow Modal */}
      {showBatchExecutor && (
        <BulkTestingWorkflow
          groupId={groupId}
          onClose={() => setShowBatchExecutor(false)}
        />
      )}
    </div>
  );
};

export default VisualNodeEditor;

// Made with Bob
