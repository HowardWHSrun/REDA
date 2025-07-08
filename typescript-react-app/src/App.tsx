 // ========================================================================
// REDA EMC Testing Tool - Main Application Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Main React application component with theme management and routing
// ========================================================================

import React, { useCallback, useState, useEffect, Suspense, lazy } from 'react';
import { AppContextProvider, useCurrentMode, useAppContext, useCsvOverlayState } from './context/AppContext';
import { FolderBrowser, WelcomeGuide } from './components';
import { ApplicationMode, CsvOverlayDataset, BandType } from './types';
import { CsvService } from './services/CsvService';
import { NoiseAnalysisService } from './services/NoiseAnalysisService';
import {
  APP_CONFIG,
  CSV_THEME,
  IMAGE_THEME,
  CORRECTION_THEME
} from './constants';
import './App.css';

// Lazy load heavy components for better performance
const CsvVisualization = lazy(() => import('./components/CsvVisualization/CsvVisualization'));

// ========================================================================
// SMALL ALWAYS-VISIBLE HEADER (NO POPUP BEHAVIOR)
// ========================================================================

// ========================================================================
// THEME PROVIDER COMPONENT
// ========================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const currentMode = useCurrentMode();
  
  // Select theme based on current mode
  const getTheme = (mode: ApplicationMode) => {
    switch (mode) {
      case 'csv': return CSV_THEME;
      case 'images': return IMAGE_THEME;
      case 'correction': return CORRECTION_THEME;
      default: return CSV_THEME;
    }
  };

  const theme = getTheme(currentMode);

  // Apply theme to CSS custom properties
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme colors
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-surface', theme.colors.surface);
    root.style.setProperty('--color-text', theme.colors.text);
    root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--color-border', theme.colors.border);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-error', theme.colors.error);

    // Apply typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-size-small', theme.typography.fontSize.small);
    root.style.setProperty('--font-size-medium', theme.typography.fontSize.medium);
    root.style.setProperty('--font-size-large', theme.typography.fontSize.large);
    root.style.setProperty('--font-size-xlarge', theme.typography.fontSize.xlarge);

    // Apply spacing
    root.style.setProperty('--spacing-xs', theme.spacing.xs);
    root.style.setProperty('--spacing-sm', theme.spacing.sm);
    root.style.setProperty('--spacing-md', theme.spacing.md);
    root.style.setProperty('--spacing-lg', theme.spacing.lg);
    root.style.setProperty('--spacing-xl', theme.spacing.xl);

    // Apply border radius
    root.style.setProperty('--border-radius-small', theme.borderRadius.small);
    root.style.setProperty('--border-radius-medium', theme.borderRadius.medium);
    root.style.setProperty('--border-radius-large', theme.borderRadius.large);

    // Apply theme class to body
    document.body.className = `${theme.name}-theme`;
  }, [theme]);

  return <>{children}</>;
};

const ApplicationHeader: React.FC = () => {
  return (
    <header 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        fontWeight: '600',
        color: '#2c3e50'
      }}>
        <img 
          src="/tenco-logo.png" 
          alt="Turner Engineering Corporation" 
          style={{
            height: '20px',
            width: 'auto'
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span>Figure Export Tool v4.1</span>
        <span style={{ color: '#7f8c8d', fontSize: '11px' }}>•</span>
        <span style={{ color: '#7f8c8d', fontSize: '11px' }}>Turner Engineering Corporation</span>
      </div>
    </header>
  );
};

// ========================================================================
// FILE SELECTION INTERFACE
// ========================================================================

interface SelectedFileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
  isCSV?: boolean;
  detectedBand?: BandType | null;
  bandConfidence?: 'high' | 'medium' | 'low';
  fileHandle?: any; // File handle for File System Access API
  noisinessAnalysis?: any; // From NoiseAnalysisService
}

// ========================================================================
// WELCOME GUIDE STATE MANAGEMENT
// ========================================================================

// ========================================================================
// TOAST NOTIFICATION COMPONENT
// ========================================================================

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50px',
        right: '20px',
        zIndex: 10000,
        background: getBackgroundColor(),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        fontWeight: '500',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {message}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// ========================================================================
// MAIN APPLICATION CONTENT
// ========================================================================

const ApplicationContent: React.FC = () => {
  const currentMode = useCurrentMode();
  const { updateCsvOverlayState } = useAppContext();
  const { csvOverlayState } = useCsvOverlayState();

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Welcome guide state
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome guide before
    const hasSeenGuide = localStorage.getItem('reda_welcome_guide_seen');
    if (!hasSeenGuide) {
      setShowWelcomeGuide(true);
    }
  }, []);

  const handleWelcomeGuideClose = () => {
    setShowWelcomeGuide(false);
    localStorage.setItem('reda_welcome_guide_seen', 'true');
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // ========================================================================
  // FILE LOADING FUNCTIONALITY
  // ========================================================================

  const handleFilesSelected = useCallback(async (selectedItems: SelectedFileItem[], panelId: string) => {
    const panelName = panelId === 'dataset-a' ? 'Dataset A' : 'Dataset B';
    const existingDatasetsFromPanel = csvOverlayState.datasets.filter((dataset: CsvOverlayDataset) => dataset.panelId === panelId);
    
    if (selectedItems.length === 0) {
      // Clear only datasets from this panel when no files are selected
      updateCsvOverlayState({
        datasets: csvOverlayState.datasets.filter((dataset: CsvOverlayDataset) => dataset.panelId !== panelId)
      });
      
      if (existingDatasetsFromPanel.length > 0) {
        const fileName = existingDatasetsFromPanel[0].filename;
        showToast(`Removed "${fileName}" from ${panelName}`, 'info');
      } else {
        showToast(`No file to clear from ${panelName}`, 'info');
      }
      return;
    }

    try {
      // Clear only existing datasets from this panel when new files are selected
      const filteredDatasets = csvOverlayState.datasets.filter((dataset: CsvOverlayDataset) => dataset.panelId !== panelId);
      const wasCleared = csvOverlayState.datasets.length > filteredDatasets.length;
      
      console.log(`🧹 Clearing datasets from ${panelId}. Before: ${csvOverlayState.datasets.length}, After: ${filteredDatasets.length}`);
      updateCsvOverlayState({
        datasets: filteredDatasets
      });

      console.log(`Loading 1 file from ${panelId}...`);
      
      const newFile = selectedItems[0]; // Only one file since we enforce single selection
      const newBand = newFile?.detectedBand;
      
      if (wasCleared && existingDatasetsFromPanel.length > 0) {
        const oldFileName = existingDatasetsFromPanel[0].filename;
        const oldBand = existingDatasetsFromPanel[0].label?.match(/\((.*?)\)/)?.[1];
        
        if (newBand && oldBand && newBand !== oldBand) {
          showToast(`${panelName}: Switched from "${oldFileName}" (${oldBand}) to "${newFile.name}" (${newBand})`, 'info');
        } else {
          showToast(`${panelName}: Switched from "${oldFileName}" to "${newFile.name}"`, 'info');
        }
      } else {
        showToast(`Loading "${newFile.name}" into ${panelName}...`, 'info');
      }

      // Process the single file
      const newDatasets: CsvOverlayDataset[] = [];

      if (!newFile.fileHandle) {
        console.warn(`No file handle for ${newFile.name}, skipping...`);
        return;
        }

        try {
          // Get the actual file from the handle
        const file = await newFile.fileHandle.getFile();
        console.log(`Reading file: ${newFile.name} (${(file.size / 1024).toFixed(1)} KB)`);
          
          // Parse the actual CSV file
          const parseResult = await CsvService.parseCsvFile(file);
          
          if (parseResult.success && parseResult.data) {
            // Assign colors based on panel: Left=Blue, Right=Orange
            let color: string;
            if (panelId === 'dataset-a') {
              color = '#1f77b4'; // Professional blue for left panel
            } else if (panelId === 'dataset-b') {
              color = '#ff7f0e'; // Professional orange for right panel
            } else {
            color = APP_CONFIG.chartColors[0];
            }
            
            // Detect band from actual frequency data if not already detected
          let detectedBand = newFile.detectedBand;
            
            if (!detectedBand) {
              const frequencies = parseResult.data.map(point => point.frequency / 1e6); // Convert to MHz
              const minFreq = Math.min(...frequencies);
              const maxFreq = Math.max(...frequencies);
              detectedBand = CsvService.detectBandFromFrequencyRange(minFreq, maxFreq);
            }
            
            // Calculate noisiness if not already available
            let noisinessIndex, noisinessCategory;
            if (newFile.noisinessAnalysis) {
              noisinessIndex = newFile.noisinessAnalysis.noisinessIndex;
              noisinessCategory = newFile.noisinessAnalysis.category;
            } else {
              const noisinessResult = NoiseAnalysisService.calculateNoisinessIndex(parseResult.data, newFile.name);
              noisinessIndex = noisinessResult.noisinessIndex;
              noisinessCategory = noisinessResult.category;
            }
            
            const dataset = {
              id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filename: newFile.name,
              data: parseResult.data,
              color: color,
              frequencyData: parseResult.data.map(point => point.frequency / 1e6), // Convert to MHz
              amplitudeData: parseResult.data.map(point => point.amplitude),
              visible: true,
            label: `${newFile.name} (${detectedBand || 'Unknown'})`,
              panelId: panelId, // Store which panel this came from
              noisinessIndex: noisinessIndex,
              noisinessCategory: noisinessCategory
            };
            
            newDatasets.push(dataset);
          console.log(`✅ Loaded: ${newFile.name} with ${parseResult.data.length} data points (${detectedBand || 'Unknown band'}) from ${panelId}`);
          } else {
          console.error(`Failed to parse ${newFile.name}:`, parseResult.errors);
          showToast(`Failed to parse "${newFile.name}"`, 'error');
          return;
          }
        } catch (fileError) {
        console.error(`Error reading file ${newFile.name}:`, fileError);
        showToast(`Error reading "${newFile.name}"`, 'error');
        return;
      }

      // Update state with the new dataset
      if (newDatasets.length > 0) {
        const finalDatasets = [...filteredDatasets, ...newDatasets];
        console.log(`📊 Adding 1 new dataset to ${filteredDatasets.length} existing. Total: ${finalDatasets.length}`);
        updateCsvOverlayState({
          datasets: finalDatasets
        });
        showToast(`Successfully loaded "${newFile.name}" to plot`, 'success');
      }

      console.log('🎯 File loaded successfully for', panelId);
    } catch (error) {
      console.error('Error loading file:', error);
      showToast('Failed to load selected file. Please try again.', 'error');
    }
  }, [updateCsvOverlayState, csvOverlayState]);

  const renderModeContent = () => {
    switch (currentMode) {
      case 'csv':
        return (
          <div className="csv-mode-content three-panel-layout" style={{ height: '100%' }}>
            {/* Left Panel - Primary Folder Browser */}
            <div className="left-panel" style={{ height: '100%' }}>
              <FolderBrowser 
                panelId="dataset-a"
                title="Dataset A"
                maxFiles={1}
                onFilesSelected={(files) => handleFilesSelected(files, 'dataset-a')}
              />
            </div>

            {/* Center Panel - Spectrum Visualization */}
            <div className="center-panel" data-guide-id="chart" style={{ height: '100%' }}>
              <Suspense fallback={
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '400px',
                  fontSize: '16px',
                  color: '#666'
                }}>
                  Loading EMC Visualization...
                </div>
              }>
                <CsvVisualization 
                  showControls={false}
                  showLegend={true}
                />
              </Suspense>
            </div>

            {/* Right Panel - Secondary Folder Browser */}
            <div className="right-panel" style={{ height: '100%' }}>
              <FolderBrowser 
                panelId="dataset-b"
                title="Dataset B"
                maxFiles={1}
                onFilesSelected={(files) => handleFilesSelected(files, 'dataset-b')}
              />
            </div>
          </div>
        );
      case 'images':
        return (
          <div className="image-mode-content">
            <div className="mode-placeholder">
              <h3>📷 Image Annotation Mode</h3>
              <p>Upload and annotate EMC test images with measurement tools</p>
              <small>This functionality will be implemented in the next phase</small>
            </div>
          </div>
        );
      case 'correction':
        return (
          <div className="correction-mode-content">
            <div className="mode-placeholder">
              <h3>⚡ EMI Correction Mode</h3>
              <p>Apply PCEP corrections to measurement data for accurate analysis</p>
              <small>This functionality will be implemented in the next phase</small>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="app-main" style={{ height: '100vh', overflow: 'hidden', paddingTop: '32px' }}>
      <div className="main-content" style={{ height: 'calc(100% - 32px)' }}>
        {renderModeContent()}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      <WelcomeGuide 
        isVisible={showWelcomeGuide}
        onClose={handleWelcomeGuideClose}
      />
    </main>
  );
};

// ========================================================================
// FOOTER REMOVED - KEEPING ONLY SMALL TOP HEADER
// ========================================================================

// ========================================================================
// MAIN APP COMPONENT (WITH CONTEXT)
// ========================================================================

const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <ThemeProvider>
        <ApplicationHeader />
        <ApplicationContent />
      </ThemeProvider>
    </div>
  );
};

// ========================================================================
// ROOT APP COMPONENT
// ========================================================================

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <AppContent />
    </AppContextProvider>
  );
};

export default App;
