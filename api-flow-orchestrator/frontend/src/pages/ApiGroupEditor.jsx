import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { apiGroupService, apiNodeService, executionService } from '../services/api';
import VisualNodeEditor from '../components/VisualNodeEditor';
import ExecutionResults from '../components/ExecutionResults';
import PerformanceHeatmap from '../components/PerformanceHeatmap';
import { generateExecutionReportPDF, generateSimpleReport } from '../utils/pdfGenerator';
import './ApiGroupEditor.css';
import { useState, useEffect } from 'react';

function ApiGroupEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showVariables, setShowVariables] = useState(false);
  const [generateApiResponse, setGenerateApiResponse] = useState(false);
  
  // Handle Performance Dashboard button click
  const handleOpenPerformanceDashboard = () => {
    const url = `/groups/${id}/performance`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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

  const executeMutation = useMutation({
    mutationFn: (groupId) => executionService.execute(groupId),
    onSuccess: async (response) => {
      alert(`Execution completed! Status: ${response.data.status}`);
      await queryClient.invalidateQueries(['executionRuns', id]);
      await queryClient.invalidateQueries(['latestRun', id]);
      
      // Generate PDF if checkbox is checked
      if (generateApiResponse) {
        setTimeout(async () => {
          await handleGeneratePDF();
        }, 1000); // Wait for data to refresh
      }
    },
    onError: (error) => {
      alert(`Execution failed: ${error.message}`);
    }
  });
  
  // Generate PDF report
  const handleGeneratePDF = async () => {
    if (!nodes || nodes.length === 0) {
      alert('No APIs configured in this group');
      return;
    }
    
    try {
      const result = await generateExecutionReportPDF(
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
      console.error('PDF generation failed, falling back to text report:', error);
      // Fallback to simple text report
      const result = generateSimpleReport(
        group?.name || 'API Group',
        nodes,
        latestRun
      );
      if (result.success) {
        alert(`Text report generated: ${result.fileName}\n\nNote: Install jsPDF for PDF generation:\nnpm install jspdf jspdf-autotable`);
      }
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
        </div>
        <div className="control-bar-right">
          <button
            className="performance-dashboard-btn"
            onClick={handleOpenPerformanceDashboard}
            title="Open Performance Dashboard in new tab"
          >
            📊 Performance Dashboard
          </button>
        </div>
      </div>

      {/* Variables Section */}
      <div className="variables-section">
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
      
      <div className="editor-container">
        <VisualNodeEditor
          groupId={id}
          nodes={nodes}
          onSave={handleSaveNode}
          onExecute={handleExecute}
          latestRun={latestRun}
          generateApiResponse={generateApiResponse}
        />
        
        <PerformanceHeatmap groupId={id} />
        
        <ExecutionResults groupId={id} />
      </div>
    </div>
  );
}

export default ApiGroupEditor;

// Made with Bob
