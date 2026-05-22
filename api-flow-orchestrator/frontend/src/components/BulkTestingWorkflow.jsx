import React, { useState } from 'react';
import { FileSpreadsheet, Settings, PlayCircle, BarChart3 } from 'lucide-react';
import BulkTestUploader from './BulkTestUploader';
import FieldMappingEditor from './FieldMappingEditor';
import TestResultsDashboard from './TestResultsDashboard';
import './BulkTestingWorkflow.css';

const BulkTestingWorkflow = ({ groupId, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Mapping, 3: Results
  const [fileData, setFileData] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);

  const handleFileUploaded = (data) => {
    setFileData(data);
    setCurrentStep(2);
  };

  const handleMappingComplete = (result) => {
    setExecutionResult(result);
    setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setFileData(null);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFileData(null);
    setExecutionResult(null);
    onClose();
  };

  const steps = [
    { number: 1, title: 'Upload File', icon: FileSpreadsheet },
    { number: 2, title: 'Configure Mappings', icon: Settings },
    { number: 3, title: 'View Results', icon: BarChart3 }
  ];

  return (
    <div className="bulk-testing-workflow">
      {/* Progress Steps */}
      <div className="workflow-steps">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className={`workflow-step ${currentStep >= step.number ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}>
              <div className="step-icon">
                <step.icon size={24} />
              </div>
              <div className="step-info">
                <span className="step-number">Step {step.number}</span>
                <span className="step-title">{step.title}</span>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`step-connector ${currentStep > step.number ? 'active' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="workflow-content">
        {currentStep === 1 && (
          <BulkTestUploader
            groupId={groupId}
            onFileUploaded={handleFileUploaded}
            onClose={handleClose}
          />
        )}

        {currentStep === 2 && fileData && (
          <FieldMappingEditor
            fileData={fileData}
            groupId={groupId}
            onMappingComplete={handleMappingComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && executionResult && (
          <TestResultsDashboard
            runId={executionResult.bulkTestRunId}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default BulkTestingWorkflow;

// Made with Bob
