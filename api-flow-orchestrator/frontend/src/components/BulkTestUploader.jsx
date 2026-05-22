import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import './BulkTestUploader.css';

const BulkTestUploader = ({ groupId, onFileUploaded, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile) => {
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/bulk-test/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('File uploaded successfully:', response.data);
      onFileUploaded(response.data);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={48} />;
    return file.name.endsWith('.csv') ? <FileText size={48} /> : <FileSpreadsheet size={48} />;
  };

  return (
    <div className="bulk-test-uploader-overlay" onClick={onClose}>
      <div className="bulk-test-uploader-modal" onClick={(e) => e.stopPropagation()}>
        <div className="uploader-header">
          <h2>Upload Test Data</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="uploader-content">
          <div
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!file ? (
              <>
                <div className="upload-icon">{getFileIcon()}</div>
                <h3>Drag & Drop your file here</h3>
                <p>or</p>
                <label htmlFor="file-input" className="file-select-btn">
                  Browse Files
                </label>
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  style={{ display: 'none' }}
                />
                <p className="file-info">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                <p className="file-info">Maximum file size: 10MB</p>
              </>
            ) : (
              <div className="file-selected">
                <div className="file-icon">{getFileIcon()}</div>
                <div className="file-details">
                  <h4>{file.name}</h4>
                  <p>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <button className="remove-file-btn" onClick={removeFile}>
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="upload-info">
            <h4>File Format Requirements</h4>
            <ul>
              <li>
                <CheckCircle size={16} className="check-icon" />
                First row must contain column headers
              </li>
              <li>
                <CheckCircle size={16} className="check-icon" />
                Input columns: Variable names (e.g., PRODUCT_ID, USER_NAME)
              </li>
              <li>
                <CheckCircle size={16} className="check-icon" />
                Assertion columns: Prefix with ASSERT_ (e.g., ASSERT_STATUS_CODE)
              </li>
              <li>
                <CheckCircle size={16} className="check-icon" />
                Optional: TEST_CASE column for test case identifiers
              </li>
            </ul>
          </div>

          <div className="example-section">
            <h4>Example CSV Structure</h4>
            <pre className="example-csv">
{`TEST_CASE,PRODUCT_ID,USER_NAME,ASSERT_STATUS_CODE,ASSERT_MESSAGE
TC001,123,john_doe,200,Product deleted successfully
TC002,456,jane_smith,200,Product deleted successfully
TC003,999,admin,404,Product not found`}
            </pre>
          </div>
        </div>

        <div className="uploader-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkTestUploader;

// Made with Bob