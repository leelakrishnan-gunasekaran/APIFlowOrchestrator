import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Link2, Upload } from 'lucide-react';
import { apiGroupService, apiNodeService, executionService, columnVariableService } from '../services/api';
import VisualNodeEditor from '../components/VisualNodeEditor';
import BulkTestingWorkflow from '../components/BulkTestingWorkflow';
import AddVariables from '../components/AddVariables';
import { generateExecutionReportPDF, generateSimpleReport } from '../utils/pdfGenerator';
import './ApiGroupEditor.css';
import { useState, useEffect } from 'react';

function ApiGroupEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showVariables, setShowVariables] = useState(false);
  const [showAddVariables, setShowAddVariables] = useState(false);
  const [generateApiResponse, setGenerateApiResponse] = useState(false);
  const [activeTab, setActiveTab] = useState('chaining'); // 'chaining' or 'bulk'

  const { data: group, isLoading } = useQuery({
    queryKey: ['apiGroup', id],
    queryFn: async () => {
      const response = await apiGroupService.getById(id);
      return response.data;
    },
  });

  const { data: nodes, refetch: refetchNodes } = useQuery({
    queryKey: ['apiNodes', id],
    queryFn: async () => {
      const response = await apiNodeService.getByGroupId(id);
      return response.data;
    },
  });

  const { data: latestRun } = useQuery({
    queryKey: ['latestRun', id],
    queryFn: async () => {
      const response = await executionService.getRecentRuns(id);
      return response.data && response.data.length > 0 ? response.data[0] : null;
    },
  });

  const { data: columnVariables = [], refetch: refetchColumnVariables } = useQuery({
    queryKey: ['columnVariables', id],
    queryFn: async () => {
      const response = await columnVariableService.getByGroupId(id);
      return response.data;
    },
  });

  const executeMutation = useMutation({
    mutationFn: (groupId) => executionService.execute(groupId),
    onSuccess: async (response) => {
      const data = response.data;
      let message = `Execution completed!\n\nStatus: ${data.status}\nExecuted: ${data.executedNodes}/${data.totalNodes} nodes`;
      
      // Add error details if execution failed
      if (data.status === 'FAILED' && data.results && data.results.length > 0) {
        const failedNode = data.results[data.results.length - 1];
        if (failedNode.error) {
          message += `\n\nFailed Node: ${failedNode.nodeName}\nError: ${failedNode.error}`;
        }
      }
      
      alert(message);
      await queryClient.invalidateQueries(['executionRuns', id]);
      await queryClient.invalidateQueries(['latestRun', id]);
      
      // Generate PDF if checkbox is checked and execution was successful
      if (generateApiResponse && data.status === 'SUCCESS') {
        setTimeout(() => {
          handleGeneratePDF();
        }, 1000); // Wait for data to refresh
      }
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || error.message;
      alert(`Execution failed: ${errorMessage}`);
    }
  });
  
  // Generate PDF report
  const handleGeneratePDF = () => {
    if (!nodes || nodes.length === 0) {
      alert('No APIs configured in this group');
      return;
    }
    
    try {
      const result = generateExecutionReportPDF(
        group?.name || 'API Group',
        nodes,
        latestRun
      );
      
      if (result.success) {
        alert(`PDF report generated successfully: ${result.fileName}`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Failed to generate PDF report: ${error.message}\n\nPlease check the browser console for details.`);
    }
  };
  
  // Watch for checkbox changes and inform user
  useEffect(() => {
    if (generateApiResponse) {
      console.log('PDF generation enabled - will generate report after next execution');
    }
  }, [generateApiResponse]);

  const handleSaveNode = async ({ action, nodeData, nodeId, nodeIds, groupId }) => {
    console.log('=== handleSaveNode called ===');
    console.log('action:', action);
    console.log('nodeData:', nodeData);
    console.log('nodeId:', nodeId);
    console.log('nodeIds:', nodeIds);
    console.log('groupId:', groupId);
    console.log('id from useParams:', id);
    
    try {
      if (action === 'create') {
        await apiNodeService.create(id, nodeData);
        alert('API node created successfully!');
      } else if (action === 'update') {
        await apiNodeService.update(nodeId, nodeData);
        alert('API node updated successfully!');
      } else if (action === 'delete') {
        await apiNodeService.delete(nodeId);
        alert('API node deleted successfully!');
      } else if (action === 'reorder') {
        const targetGroupId = groupId || id;
        console.log('Calling reorder with groupId:', targetGroupId, 'nodeIds:', nodeIds);
        await apiNodeService.reorder(targetGroupId, nodeIds);
        console.log('Reorder successful');
        // Don't show alert for reorder, it's a quick action
      }
      refetchNodes();
    } catch (error) {
      console.error('Error in handleSaveNode:', error);
      console.error('Error response:', error.response);
      alert(`Failed to ${action} node: ${error.message}`);
    }
  };

  const handleExecute = (groupId) => {
    if (window.confirm('Execute this API flow?')) {
      executeMutation.mutate(groupId);
    }
  };

  // Column Variables handlers
  const handleAddColumnVariable = async (data) => {
    try {
      await columnVariableService.create(id, data);
      refetchColumnVariables();
      alert('Variable added successfully!');
    } catch (error) {
      console.error('Error adding variable:', error);
      throw error;
    }
  };

  const handleUpdateColumnVariable = async (variableId, data) => {
    try {
      await columnVariableService.update(id, variableId, data);
      refetchColumnVariables();
      alert('Variable updated successfully!');
    } catch (error) {
      console.error('Error updating variable:', error);
      throw error;
    }
  };

  const handleDeleteColumnVariable = async (variableId) => {
    try {
      await columnVariableService.delete(id, variableId);
      refetchColumnVariables();
      alert('Variable deleted successfully!');
    } catch (error) {
      console.error('Error deleting variable:', error);
      throw error;
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  // Extract all variables from all API nodes with their actual values
  const extractVariablesFromNodes = () => {
    if (!nodes || nodes.length === 0) return [];
    
    const variables = [];
    
    // Create a map of extracted values from the latest run
    const extractedValues = {};
    if (latestRun && latestRun.apiRunResults) {
      latestRun.apiRunResults.forEach(result => {
        if (result.response) {
          try {
            const responseData = JSON.parse(result.response);
            const node = nodes.find(n => n.id === result.apiNodeId);
            if (node && node.fieldMappings) {
              Object.entries(node.fieldMappings).forEach(([varName, jsonPath]) => {
                const value = extractValueFromJsonPath(responseData, jsonPath);
                if (value !== null && value !== undefined) {
                  extractedValues[`${result.apiNodeId}-${varName}`] = value;
                }
              });
            }
          } catch (e) {
            console.error('Failed to parse response:', e);
          }
        }
      });
    }
    
    nodes.forEach(node => {
      if (node.fieldMappings && Object.keys(node.fieldMappings).length > 0) {
        Object.entries(node.fieldMappings).forEach(([varName, jsonPath]) => {
          const valueKey = `${node.id}-${varName}`;
          variables.push({
            apiName: node.name,
            apiId: node.id,
            variableName: varName,
            jsonPath: jsonPath,
            method: node.method,
            url: node.url,
            extractedValue: extractedValues[valueKey] || 'Not executed yet'
          });
        });
      }
    });
    return variables;
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

  const allVariables = extractVariablesFromNodes();

  return (
    <div className="api-group-editor-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <div className="page-title">
          <h1>{group?.name}</h1>
          <p>{group?.description}</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="control-bar">
        <div className="control-bar-left">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={generateApiResponse}
              onChange={(e) => setGenerateApiResponse(e.target.checked)}
            />
            <span>Auto-generate PDF Report</span>
          </label>
          <button
            className="generate-report-btn"
            onClick={handleGeneratePDF}
            disabled={!nodes || nodes.length === 0}
            title="Generate PDF report of current execution results"
          >
            📄 Generate Report Now
          </button>
          <button
            className="performance-dashboard-btn"
            onClick={() => window.open(`/performance-dashboard/${id}`, '_blank')}
            title="View performance dashboard and execution history"
          >
            📊 Performance Dashboard
          </button>
        </div>
      </div>

      {/* Extracted Variables Section */}
      <div className="variables-section extracted-variables">
        <button
          className="variables-toggle"
          onClick={() => setShowVariables(!showVariables)}
        >
          <span>Extracted Variables ({allVariables.length})</span>
          {showVariables ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {showVariables && (
          <div className="variables-content">
            {allVariables.length === 0 ? (
              <p className="no-variables">No variables extracted yet. Configure field mappings in API nodes to extract response data.</p>
            ) : (
              <div className="variables-table">
                <table>
                  <thead>
                    <tr>
                      <th>API Name</th>
                      <th>Method</th>
                      <th>Variable Name</th>
                      <th>Extracted Value</th>
                      <th>JSON Path</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allVariables.map((variable, index) => (
                      <tr key={`${variable.apiId}-${variable.variableName}-${index}`}>
                        <td className="api-name">{variable.apiName}</td>
                        <td>
                          <span className={`method-badge method-${variable.method.toLowerCase()}`}>
                            {variable.method}
                          </span>
                        </td>
                        <td className="variable-name">
                          <code>{variable.variableName}</code>
                        </td>
                        <td className="extracted-value">
                          <span className={variable.extractedValue === 'Not executed yet' ? 'not-executed' : 'value'}>
                            {typeof variable.extractedValue === 'object'
                              ? JSON.stringify(variable.extractedValue)
                              : String(variable.extractedValue)}
                          </span>
                        </td>
                        <td className="json-path">
                          <code>{variable.jsonPath}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Variables Section */}
      <div className="variables-section add-variables-section">
        <button
          className="variables-toggle add-variables-toggle"
          onClick={() => setShowAddVariables(!showAddVariables)}
        >
          <span>Add Variables ({columnVariables.length})</span>
          {showAddVariables ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
        
        {showAddVariables && (
          <div className="variables-content">
            <AddVariables
              variables={columnVariables}
              onAdd={handleAddColumnVariable}
              onUpdate={handleUpdateColumnVariable}
              onDelete={handleDeleteColumnVariable}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'chaining' ? 'active' : ''}`}
          onClick={() => setActiveTab('chaining')}
        >
          <Link2 size={18} />
          API Chaining
        </button>
        <button
          className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          <Upload size={18} />
          Bulk Executor
        </button>
      </div>
      
      <div className="editor-container">
        {activeTab === 'chaining' ? (
          <VisualNodeEditor
            groupId={id}
            nodes={nodes}
            onSave={handleSaveNode}
            onExecute={handleExecute}
            latestRun={latestRun}
            generateApiResponse={generateApiResponse}
          />
        ) : (
          <BulkTestingWorkflow
            groupId={id}
            onClose={() => setActiveTab('chaining')}
          />
        )}
      </div>
    </div>
  );
}

export default ApiGroupEditor;

// Made with Bob
