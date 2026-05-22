import React, { useState, useEffect } from 'react';
import { ArrowRight, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './FieldMappingEditor.css';

const FieldMappingEditor = ({ fileData, groupId, onMappingComplete, onBack }) => {
  const [fieldMappings, setFieldMappings] = useState({});
  const [assertionMappings, setAssertionMappings] = useState({});
  const [availableFields, setAvailableFields] = useState([]);
  const [assertionTypes, setAssertionTypes] = useState([]);
  const [columnVariables, setColumnVariables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableFields();
    fetchColumnVariables();
    initializeMappings();
  }, [fileData, groupId]);

  const fetchAvailableFields = async () => {
    try {
      const response = await axios.get(`/api/bulk-test/fields/${groupId}`);
      setAvailableFields(response.data.apiVariables || []);
      setAssertionTypes(response.data.assertionTypes || []);
    } catch (err) {
      console.error('Error fetching available fields:', err);
    }
  };

  const fetchColumnVariables = async () => {
    try {
      console.log('Fetching column variables for groupId:', groupId);
      const response = await axios.get(`/api/groups/${groupId}/column-variables`);
      console.log('Column variables response:', response.data);
      setColumnVariables(response.data || []);
    } catch (err) {
      console.error('Error fetching column variables:', err);
      console.error('Error details:', err.response);
    }
  };

  const initializeMappings = () => {
    if (!fileData?.columnMapping) return;

    // Auto-map input columns
    const initialFieldMappings = {};
    fileData.columnMapping.inputColumns.forEach(column => {
      initialFieldMappings[column] = `{{${column}}}`;
    });
    setFieldMappings(initialFieldMappings);

    // Auto-map assertion columns
    const initialAssertionMappings = {};
    fileData.columnMapping.assertionColumns.forEach(column => {
      const assertionName = column.replace('ASSERT_', '');
      
      // Detect assertion type based on column name
      let type = 'RESPONSE_FIELD';
      let jsonPath = '';
      let operator = '==';
      
      if (column.includes('STATUS_CODE') || column.includes('STATUS')) {
        type = 'STATUS_CODE';
      } else if (column.includes('JSON_PATH') || column.includes('PATH')) {
        type = 'JSON_PATH';
      }
      
      initialAssertionMappings[assertionName] = {
        column: column,
        type: type,
        jsonPath: jsonPath,
        operator: operator
      };
    });
    setAssertionMappings(initialAssertionMappings);
  };

  const updateFieldMapping = (column, value) => {
    setFieldMappings(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const updateAssertionMapping = (name, field, value) => {
    setAssertionMappings(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        [field]: value
      }
    }));
  };

  const addCustomAssertion = () => {
    const newName = `CUSTOM_${Object.keys(assertionMappings).length + 1}`;
    setAssertionMappings(prev => ({
      ...prev,
      [newName]: {
        column: '',
        type: 'RESPONSE_FIELD',
        jsonPath: '',
        operator: '=='
      }
    }));
  };

  const removeAssertion = (name) => {
    setAssertionMappings(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const validateMappings = () => {
    // Check if at least one field mapping exists
    if (Object.keys(fieldMappings).length === 0) {
      setError('Please map at least one input field');
      return false;
    }

    // Validate assertion mappings
    for (const [name, mapping] of Object.entries(assertionMappings)) {
      if (!mapping.column) {
        setError(`Assertion ${name} is missing a column mapping`);
        return false;
      }
      if (mapping.type === 'RESPONSE_FIELD' && !mapping.jsonPath) {
        setError(`Assertion ${name} requires a JSON path`);
        return false;
      }
    }

    return true;
  };

  const handleSaveAndContinue = async () => {
    if (!validateMappings()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request = {
        fileId: fileData.fileId,
        fieldMappings: fieldMappings,
        assertionMappings: assertionMappings
      };

      const response = await axios.post(`/api/bulk-test/execute/${groupId}`, request);
      
      onMappingComplete(response.data);
      
    } catch (err) {
      console.error('Error executing bulk tests:', err);
      setError(err.response?.data?.error || 'Failed to execute bulk tests');
    } finally {
      setLoading(false);
    }
  };

  const getOperatorOptions = () => [
    { value: '==', label: 'Equals (==)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '>=', label: 'Greater or Equal (>=)' },
    { value: '<=', label: 'Less or Equal (<=)' },
    { value: 'contains', label: 'Contains' },
    { value: 'matches', label: 'Matches (Regex)' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' }
  ];

  return (
    <div className="field-mapping-editor">
      <div className="editor-header">
        <h2>Field Mapping Configuration</h2>
        <p>Map CSV columns to API variables and configure assertions</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Input Field Mappings */}
      <div className="mapping-section">
        <div className="section-header">
          <div>
            <h3>Input Variables</h3>
            <p className="section-description">
              Map CSV columns to API request variables
              {columnVariables.length > 0 && (
                <span style={{ marginLeft: '10px', color: '#10b981', fontWeight: 'bold' }}>
                  ({columnVariables.length} variable{columnVariables.length !== 1 ? 's' : ''} available)
                </span>
              )}
            </p>
          </div>
          <button
            className="btn-refresh"
            onClick={fetchColumnVariables}
            title="Refresh variables list"
          >
            🔄 Refresh Variables
          </button>
        </div>

        <div className="mappings-list">
          {fileData?.columnMapping?.inputColumns.map(column => (
            <div key={column} className="mapping-row">
              <div className="mapping-source">
                <label>CSV Column</label>
                <input
                  type="text"
                  value={column}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="mapping-arrow">
                <ArrowRight size={24} />
              </div>

              <div className="mapping-target">
                <label>API Variable</label>
                <select
                  value={fieldMappings[column] || ''}
                  onChange={(e) => updateFieldMapping(column, e.target.value)}
                  className="variable-select"
                >
                  <option value="">Select a variable...</option>
                  {columnVariables.length > 0 ? (
                    columnVariables.map(variable => (
                      <option key={variable.id} value={`{{${variable.variableName}}}`}>
                        {`{{${variable.variableName}}} -> ${variable.columnName}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No variables created yet. Create variables in "Add Variables" section first.</option>
                  )}
                </select>
                {columnVariables.length === 0 && (
                  <p className="helper-text">
                    💡 Tip: Create variables in the "Add Variables" section above before mapping
                  </p>
                )}
              </div>

              <div className="mapping-preview">
                <span className="preview-label">Preview:</span>
                <code>{fileData.preview?.[0]?.[column] || 'N/A'}</code>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assertion Mappings */}
      <div className="mapping-section">
        <div className="section-header">
          <div>
            <h3>Assertions</h3>
            <p className="section-description">
              Configure validation rules for test results
            </p>
          </div>
          <button className="btn-add" onClick={addCustomAssertion}>
            <Plus size={18} />
            Add Custom Assertion
          </button>
        </div>

        <div className="assertions-list">
          {Object.entries(assertionMappings).map(([name, mapping]) => (
            <div key={name} className="assertion-config">
              <div className="assertion-header">
                <h4>{name}</h4>
                <button 
                  className="btn-remove"
                  onClick={() => removeAssertion(name)}
                  title="Remove assertion"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="assertion-fields">
                <div className="field-group">
                  <label>CSV Column</label>
                  <select
                    value={mapping.column}
                    onChange={(e) => updateAssertionMapping(name, 'column', e.target.value)}
                  >
                    <option value="">Select column...</option>
                    {fileData?.headers?.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label>Assertion Type</label>
                  <select
                    value={mapping.type}
                    onChange={(e) => updateAssertionMapping(name, 'type', e.target.value)}
                  >
                    {assertionTypes.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {mapping.type === 'RESPONSE_FIELD' && (
                  <>
                    <div className="field-group">
                      <label>JSON Path</label>
                      <input
                        type="text"
                        value={mapping.jsonPath}
                        onChange={(e) => updateAssertionMapping(name, 'jsonPath', e.target.value)}
                        placeholder="$.data.field"
                      />
                    </div>

                    <div className="field-group">
                      <label>Operator</label>
                      <select
                        value={mapping.operator}
                        onChange={(e) => updateAssertionMapping(name, 'operator', e.target.value)}
                      >
                        {getOperatorOptions().map(op => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {mapping.column && fileData?.preview?.[0] && (
                  <div className="field-preview">
                    <span className="preview-label">Expected Value:</span>
                    <code>{fileData.preview[0][mapping.column] || 'N/A'}</code>
                  </div>
                )}
              </div>
            </div>
          ))}

          {Object.keys(assertionMappings).length === 0 && (
            <div className="no-assertions">
              <p>No assertions configured. Click "Add Custom Assertion" to add one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="mapping-section preview-section">
        <h3>Mapping Preview</h3>
        <div className="preview-grid">
          <div className="preview-column">
            <h4>Input Variables ({Object.keys(fieldMappings).length})</h4>
            <pre className="preview-json">
              {JSON.stringify(fieldMappings, null, 2)}
            </pre>
          </div>
          <div className="preview-column">
            <h4>Assertions ({Object.keys(assertionMappings).length})</h4>
            <pre className="preview-json">
              {JSON.stringify(assertionMappings, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="editor-actions">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={handleSaveAndContinue}
          disabled={loading}
        >
          {loading ? (
            'Executing Tests...'
          ) : (
            <>
              <Save size={18} />
              Execute Bulk Tests
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FieldMappingEditor;

// Made with Bob
