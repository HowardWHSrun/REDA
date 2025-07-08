// ========================================================================
// REDA EMC Testing Tool - CSV Upload Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// File upload component with drag-and-drop, validation, and preview
// ========================================================================

import React, { useState, useRef, useCallback } from 'react';
import { useAppContext, useCsvOverlayState } from '../../context/AppContext';
import { CsvService } from '../../services/CsvService';
import { FileAnalysis, CsvOverlayDataset } from '../../types';
import { APP_CONFIG, SUPPORTED_CSV_TYPES } from '../../constants';
import './CsvUpload.css';

// ========================================================================
// UPLOAD COMPONENT INTERFACES
// ========================================================================

interface CsvUploadProps {
  maxFiles?: number;
  showAnalysis?: boolean;
  onFilesUploaded?: (datasets: CsvOverlayDataset[]) => void;
  onError?: (error: string) => void;
}

interface FileUploadState {
  isDragging: boolean;
  isProcessing: boolean;
  uploadedFiles: FileAnalysis[];
  errors: string[];
  warnings: string[];
}

// ========================================================================
// CSV UPLOAD COMPONENT
// ========================================================================

export const CsvUpload: React.FC<CsvUploadProps> = ({
  maxFiles = 8,
  showAnalysis = true,
  onFilesUploaded,
  onError
}) => {
  const { addCsvOverlayDataset } = useAppContext();
  const { csvOverlayState } = useCsvOverlayState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadState, setUploadState] = useState<FileUploadState>({
    isDragging: false,
    isProcessing: false,
    uploadedFiles: [],
    errors: [],
    warnings: []
  });

  // ========================================================================
  // FILE VALIDATION
  // ========================================================================

  const validateFiles = useCallback((files: FileList | File[]): { valid: File[]; errors: string[] } => {
    const fileArray = Array.from(files);
    const valid: File[] = [];
    const errors: string[] = [];

    // Check file count
    const totalFiles = csvOverlayState.datasets.length + fileArray.length;
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed. Currently ${csvOverlayState.datasets.length} files loaded.`);
      return { valid, errors };
    }

    for (const file of fileArray) {
      // Check file type
      if (!CsvService.isValidCsvFile(file)) {
        errors.push(`Invalid file type: ${file.name}. Please select CSV or TXT files.`);
        continue;
      }

      // Check file size
      if (file.size > APP_CONFIG.maxFileSize) {
        errors.push(`File too large: ${file.name}. Maximum size is ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB.`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = csvOverlayState.datasets.some(dataset => 
        dataset.filename === file.name
      );
      if (isDuplicate) {
        errors.push(`File already loaded: ${file.name}`);
        continue;
      }

      valid.push(file);
    }

    return { valid, errors };
  }, [csvOverlayState.datasets, maxFiles]);

  // ========================================================================
  // FILE PROCESSING
  // ========================================================================

  const processFiles = useCallback(async (files: File[]) => {
    setUploadState(prev => ({ ...prev, isProcessing: true, errors: [], warnings: [] }));

    const newDatasets: CsvOverlayDataset[] = [];
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    const analyses: FileAnalysis[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const colorIndex = (csvOverlayState.datasets.length + i) % APP_CONFIG.chartColors.length;
        const color = APP_CONFIG.chartColors[colorIndex];

        try {
          // Create overlay dataset
          const result = await CsvService.createOverlayDataset(file, color);
          
          if (result.success && result.data) {
            newDatasets.push(result.data);
            allWarnings.push(...result.warnings);

            // Analyze file
            if (showAnalysis) {
              const analysis = CsvService.analyzeFile(file, result.data.data);
              analyses.push(analysis);
            }
          } else {
            allErrors.push(...result.errors);
          }
        } catch (error) {
          allErrors.push(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Add successful datasets to state
      for (const dataset of newDatasets) {
        addCsvOverlayDataset(dataset);
      }

      // Update component state
      setUploadState(prev => ({
        ...prev,
        isProcessing: false,
        uploadedFiles: [...prev.uploadedFiles, ...analyses],
        errors: allErrors,
        warnings: allWarnings
      }));

      // Notify parent component
      if (onFilesUploaded && newDatasets.length > 0) {
        onFilesUploaded(newDatasets);
      }

      if (onError && allErrors.length > 0) {
        onError(allErrors.join('; '));
      }

    } catch (error) {
      const errorMessage = `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setUploadState(prev => ({
        ...prev,
        isProcessing: false,
        errors: [errorMessage]
      }));

      if (onError) {
        onError(errorMessage);
      }
    }
  }, [addCsvOverlayDataset, csvOverlayState.datasets.length, showAnalysis, onFilesUploaded, onError]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setUploadState(prev => ({ ...prev, errors }));
      return;
    }

    await processFiles(valid);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [validateFiles, processFiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragging: true }));
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setUploadState(prev => ({ ...prev, isDragging: false }));

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    const { valid, errors } = validateFiles(files);
    
    if (errors.length > 0) {
      setUploadState(prev => ({ ...prev, errors }));
      return;
    }

    await processFiles(valid);
  }, [validateFiles, processFiles]);

  const handleClick = useCallback(() => {
    if (uploadState.isProcessing) return;
    fileInputRef.current?.click();
  }, [uploadState.isProcessing]);

  const clearErrors = useCallback(() => {
    setUploadState(prev => ({ ...prev, errors: [], warnings: [] }));
  }, []);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderUploadArea = () => {
    const hasFiles = csvOverlayState.datasets.length > 0;
    const remainingSlots = maxFiles - csvOverlayState.datasets.length;

    return (
      <div
        className={`csv-upload-area ${uploadState.isDragging ? 'dragging' : ''} ${uploadState.isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_CSV_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="upload-content">
          {uploadState.isProcessing ? (
            <>
              <div className="upload-spinner">⟳</div>
              <p>Processing files...</p>
              <small>Analyzing CSV data and detecting frequency bands</small>
            </>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p>
                {hasFiles 
                  ? `Add more CSV files (${remainingSlots} remaining)`
                  : 'Click to select or drag & drop CSV files'
                }
              </p>
              <small>
                {hasFiles
                  ? 'Multiple datasets will be displayed with different colors'
                  : 'Supports CSV files with frequency and amplitude data'
                }
              </small>
              <small>Hold Ctrl/Cmd to select multiple files</small>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    if (uploadState.errors.length === 0 && uploadState.warnings.length === 0) {
      return null;
    }

    return (
      <div className="upload-messages">
        {uploadState.errors.length > 0 && (
          <div className="error-messages">
            <h4>❌ Errors:</h4>
            <ul>
              {uploadState.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
            <button onClick={clearErrors} className="clear-errors-btn">
              Clear
            </button>
          </div>
        )}
        
        {uploadState.warnings.length > 0 && (
          <div className="warning-messages">
            <h4>⚠️ Warnings:</h4>
            <ul>
              {uploadState.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderFileAnalysis = () => {
    if (!showAnalysis || uploadState.uploadedFiles.length === 0) {
      return null;
    }

    return (
      <div className="file-analysis">
        <h4>📊 File Analysis:</h4>
        <div className="analysis-list">
          {uploadState.uploadedFiles.map((analysis, index) => (
            <div key={index} className="analysis-item">
              <div className="analysis-header">
                <span className="filename">{analysis.filename}</span>
                <span className={`status ${analysis.isValid ? 'valid' : 'invalid'}`}>
                  {analysis.isValid ? '✅' : '❌'}
                </span>
              </div>
              <div className="analysis-details">
                <span>Band: {analysis.band || 'Unknown'}</span>
                <span>Points: {analysis.dataPoints.toLocaleString()}</span>
                <span>Range: {analysis.frequencyRange.min.toFixed(1)} - {analysis.frequencyRange.max.toFixed(1)} MHz</span>
              </div>
              {analysis.errors.length > 0 && (
                <div className="analysis-errors">
                  {analysis.errors.map((error, errorIndex) => (
                    <small key={errorIndex} className="error">{error}</small>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="csv-upload-component">
      <div className="upload-header">
        <h3>📂 CSV File Upload</h3>
        <p>Upload EMC spectrum data files for analysis and comparison</p>
      </div>
      
      {renderUploadArea()}
      {renderMessages()}
      {renderFileAnalysis()}
    </div>
  );
};

export default CsvUpload; 