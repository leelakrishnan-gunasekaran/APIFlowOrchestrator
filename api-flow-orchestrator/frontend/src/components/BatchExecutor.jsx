import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Upload, FileSpreadsheet, FileText, ArrowRight, Play, X } from 'lucide-react';
import axios from 'axios';
import './BatchExecutor.css';

const BatchExecutor = ({ groupId, onClose }) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [fieldMappings, setFieldMappings] = useState({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map Fields, 3: Execute
  const [executionResult, setExecutionResult] = useState(null);

  // Fetch available API fields
  const { data: availableFields = [] } = useQuery({
    queryKey: ['batchFields', groupId],
    queryFn: async () => {
      const response = await axios.get(`/api/batch/fields/${groupId}`);
      return response.data;
    },
    enabled: step === 2,
  });

  const parseFileMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = file.name.endsWith('.csv') 
        ? '/api/batch/parse-csv'
        : '/api/batch/parse-excel';
      
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setParsedData(data);
      setStep(2);
      
      // Auto-map fields with matching names
      const autoMappings = {};
      availableFields.forEach(field => {
        if (data.columns.includes(field)) {
          autoMappings[field] = field;
        }
      });
      setFieldMappings(autoMappings);
    },
    onError: (error) => {
      alert(`Failed to parse file: ${error.response?.data || error.message}`);
    }
  });

  const executeBatchMutation = useMutation({
    mutationFn: async ({ records, mappings }) => {
      const response = await axios.post(`/api/batch/execute/${groupId}`, {
        records,
        fieldMappings: mappings
      });
      return response.data;
    },
    onSuccess: (data) => {
      setExecutionResult(data);
      setStep(3);
    },
    onError: (error) => {
      alert(`Batch execution failed: ${error.response?.data || error.message}`);
    }
  });

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        alert('Please select a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }
    parseFileMutation.mutate(file);
  };

  const handleFieldMapping = (apiField, csvColumn) => {
    setFieldMappings(prev => ({
      ...prev,
      [apiField]: csvColumn
    }));
  };

  const handleExecute = () => {
    if (Object.keys(fieldMappings).length === 0) {
      alert('Please map at least one field');
      return;
    }
    
    executeBatchMutation.mutate({
      records: parsedData.records,
      mappings: fieldMappings
    });
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setFieldMappings({});
    setStep(1);
    setExecutionResult(null);
  };

  return (
    <div className="batch-executor-overlay" onClick={onClose}>
      <div className="batch-executor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="batch-executor-header">
          <h2>Batch Execution</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="batch-executor-steps">
          <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Upload File</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Map Fields</span>
          </div>
          <div className="step-connector"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Execute</span>
          </div>
        </div>

        <div className="batch-executor-content">
          {step === 1 && (
            <div className="upload-section">
              <div className="upload-area">
                <Upload size={48} className="upload-icon" />
                <h3>Upload CSV or Excel File</h3>
                <p>Select a file containing test data for batch execution</p>
                
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <label htmlFor="file-input" className="file-select-btn">
                  {file ? (
                    <>
                      {file.name.endsWith('.csv') ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                      {file.name}
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Choose File
                    </>
                  )}
                </label>

                {file && (
                  <button 
                    className="upload-btn"
                    onClick={handleUpload}
                    disabled={parseFileMutation.isPending}
                  >
                    {parseFileMutation.isPending ? 'Parsing...' : 'Parse File'}
                    <ArrowRight size={20} />
                  </button>
                )}
              </div>

              <div className="upload-info">
                <h4>Supported Formats</h4>
                <ul>
                  <li><FileText size={16} /> CSV (.csv)</li>
                  <li><FileSpreadsheet size={16} /> Excel (.xlsx, .xls)</li>
                </ul>
                <p className="info-note">
                  First row should contain column headers that will be mapped to API variables
                </p>
              </div>
            </div>
          )}

          {step === 2 && parsedData && (
            <div className="mapping-section">
              <div className="mapping-header">
                <h3>Map Fields</h3>
                <p>Map CSV/Excel columns to API variables</p>
                <div className="data-info">
                  <span className="info-badge">{parsedData.count} records</span>
                  <span className="info-badge">{parsedData.columns.length} columns</span>
                </div>
              </div>

              <div className="mapping-list">
                {availableFields.map((apiField) => (
                  <div key={apiField} className="mapping-row">
                    <div className="api-field">
                      <label>API Variable</label>
                      <div className="field-name">{`{{${apiField}}}`}</div>
                    </div>
                    
                    <ArrowRight size={20} className="mapping-arrow" />
                    
                    <div className="csv-field">
                      <label>CSV/Excel Column</label>
                      <select
                        value={fieldMappings[apiField] || ''}
                        onChange={(e) => handleFieldMapping(apiField, e.target.value)}
                      >
                        <option value="">-- Select Column --</option>
                        {parsedData.columns.map((column) => (
                          <option key={column} value={column}>
                            {column}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {availableFields.length === 0 && (
                <div className="no-fields">
                  <p>No API variables found in this group</p>
                  <p className="hint">Add variables like {`{{variable_name}}`} in your API URLs or request bodies</p>
                </div>
              )}

              <div className="mapping-preview">
                <h4>Data Preview (First 3 rows)</h4>
                <table>
                  <thead>
                    <tr>
                      {parsedData.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.records.slice(0, 3).map((record, idx) => (
                      <tr key={idx}>
                        {parsedData.columns.map((col) => (
                          <td key={col}>{record[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mapping-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  Back
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleExecute}
                  disabled={Object.keys(fieldMappings).length === 0 || executeBatchMutation.isPending}
                >
                  {executeBatchMutation.isPending ? 'Executing...' : 'Execute Batch'}
                  <Play size={20} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && executionResult && (
            <div className="result-section">
              <div className="result-summary">
                <h3>Batch Execution Complete</h3>
                <div className="result-stats">
                  <div className="stat-card success">
                    <span className="stat-value">{executionResult.successCount}</span>
                    <span className="stat-label">Successful</span>
                  </div>
                  <div className="stat-card error">
                    <span className="stat-value">{executionResult.failCount}</span>
                    <span className="stat-label">Failed</span>
                  </div>
                  <div className="stat-card total">
                    <span className="stat-value">{executionResult.totalRecords}</span>
                    <span className="stat-label">Total</span>
                  </div>
                </div>
              </div>

              <div className="result-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  Run Another Batch
                </button>
                <button className="btn-primary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchExecutor;

// Made with Bob
