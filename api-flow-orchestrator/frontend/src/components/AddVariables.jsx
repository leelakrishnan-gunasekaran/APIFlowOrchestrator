import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Database } from 'lucide-react';
import './AddVariables.css';

const AddVariables = ({ variables = [], onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    variableName: '',
    columnName: '',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.variableName.trim()) {
      newErrors.variableName = 'Variable name is required';
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.variableName)) {
      newErrors.variableName = 'Variable name must start with letter or underscore and contain only alphanumeric characters';
    }
    
    if (!formData.columnName.trim()) {
      newErrors.columnName = 'Column name is required';
    }
    
    // Check for duplicate variable names
    const isDuplicate = variables.some(v => 
      v.variableName === formData.variableName && v.id !== editingId
    );
    if (isDuplicate) {
      newErrors.variableName = 'Variable name already exists';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingId) {
        await onUpdate(editingId, formData);
      } else {
        await onAdd(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving variable:', error);
      setErrors({ submit: error.message || 'Failed to save variable' });
    }
  };

  const handleEdit = (variable) => {
    setEditingId(variable.id);
    setFormData({
      variableName: variable.variableName,
      columnName: variable.columnName,
      description: variable.description || ''
    });
    setIsAdding(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this variable?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting variable:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ variableName: '', columnName: '', description: '' });
    setIsAdding(false);
    setEditingId(null);
    setErrors({});
  };

  return (
    <div className="add-variables-container">
      <div className="add-variables-header">
        <div className="header-info">
          <Database size={20} />
          <div>
            <h4>Add Variables</h4>
            <p>Map Excel column names to variables for bulk execution</p>
          </div>
        </div>
        {!isAdding && (
          <button className="btn-add-variable" onClick={() => setIsAdding(true)}>
            <Plus size={18} />
            Add Variable
          </button>
        )}
      </div>

      {isAdding && (
        <div className="variable-form">
          <div className="form-header">
            <h5>{editingId ? 'Edit Variable' : 'New Variable'}</h5>
            <button className="btn-close" onClick={resetForm}>
              <X size={18} />
            </button>
          </div>

          <div className="form-body">
            <div className="form-group">
              <label>
                Variable Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.variableName}
                onChange={(e) => setFormData({ ...formData, variableName: e.target.value })}
                placeholder="e.g., userId, productId"
                className={errors.variableName ? 'error' : ''}
              />
              {errors.variableName && (
                <span className="error-message">{errors.variableName}</span>
              )}
              <span className="help-text">
                Use this in API requests as: <code>{'{{userId}}'}</code>
              </span>
            </div>

            <div className="form-group">
              <label>
                Excel Column Name <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.columnName}
                onChange={(e) => setFormData({ ...formData, columnName: e.target.value })}
                placeholder="e.g., USER_ID, PRODUCT_ID"
                className={errors.columnName ? 'error' : ''}
              />
              {errors.columnName && (
                <span className="error-message">{errors.columnName}</span>
              )}
              <span className="help-text">
                Exact column name from your Excel file
              </span>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this variable represents"
                rows="2"
              />
            </div>

            {errors.submit && (
              <div className="error-banner">{errors.submit}</div>
            )}

            <div className="form-actions">
              <button className="btn-cancel" onClick={resetForm}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSubmit}>
                <Save size={18} />
                {editingId ? 'Update' : 'Add'} Variable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="variables-list">
        {variables.length === 0 ? (
          <div className="no-variables">
            <Database size={48} />
            <p>No variables added yet</p>
            <span>Add variables to map Excel columns to API request parameters</span>
          </div>
        ) : (
          <div className="variables-grid">
            {variables.map((variable) => (
              <div key={variable.id} className="variable-card">
                <div className="variable-header">
                  <div className="variable-name">
                    <code>{'{{' + variable.variableName + '}}'}</code>
                  </div>
                  <div className="variable-actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(variable)}
                      title="Edit variable"
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(variable.id)}
                      title="Delete variable"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="variable-mapping">
                  <span className="mapping-label">Maps to column:</span>
                  <span className="column-name">{variable.columnName}</span>
                </div>
                {variable.description && (
                  <div className="variable-description">{variable.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddVariables;

// Made with Bob