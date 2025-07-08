// ========================================================================
// REDA EMC Testing Tool - Main Application Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Main React application component with theme management and routing
// ========================================================================

import React, { useCallback } from 'react';
import { AppContextProvider, useCurrentMode, useAppContext, useCsvOverlayState } from './context/AppContext';
import { ModeSelector, CsvVisualization, FolderBrowser } from './components';
import { CsvService } from './services/CsvService';
import { ApplicationMode, BandType, CsvOverlayDataset } from './types';
import {
  APP_CONFIG,
  CSV_THEME,
  IMAGE_THEME,
  CORRECTION_THEME
} from './constants';
import './App.css';

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

// ========================================================================
// MAIN APPLICATION HEADER
// ========================================================================

const ApplicationHeader: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <img 
            src="/tenco-logo.png" 
            alt="Turner Engineering Corporation" 
            className="company-logo"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        <div className="title-section">
          <h1>{APP_CONFIG.title}</h1>
          <p className="subtitle">{APP_CONFIG.subtitle}</p>
          <p className="company-name">{APP_CONFIG.company}</p>
        </div>
        <div className="mode-selector-section">
          <ModeSelector />
        </div>
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
}

// ========================================================================
// MAIN APPLICATION CONTENT
// ========================================================================

const ApplicationContent: React.FC = () => {
  const currentMode = useCurrentMode();
  const { updateCsvOverlayState } = useAppContext();
  const { csvOverlayState } = useCsvOverlayState();

  // ========================================================================
  // FILE LOADING FUNCTIONALITY
  // ========================================================================

  const handleFilesSelected = useCallback(async (selectedItems: SelectedFileItem[], panelId: string) => {
    if (selectedItems.length === 0) {
      // Clear only datasets from this panel when no files are selected
      updateCsvOverlayState({
        datasets: csvOverlayState.datasets.filter((dataset: CsvOverlayDataset) => dataset.panelId !== panelId)
      });
      return;
    }

    try {
      // Clear only existing datasets from this panel when new files are selected
      const filteredDatasets = csvOverlayState.datasets.filter((dataset: CsvOverlayDataset) => dataset.panelId !== panelId);
      console.log(`🧹 Clearing datasets from ${panelId}. Before: ${csvOverlayState.datasets.length}, After: ${filteredDatasets.length}`);
      updateCsvOverlayState({
        datasets: filteredDatasets
      });

      console.log(`Loading ${selectedItems.length} files from ${panelId}...`);

      // Process all files and collect datasets
      const newDatasets: CsvOverlayDataset[] = [];

      for (let i = 0; i < selectedItems.length; i++) {
        const item = selectedItems[i];
        
        if (!item.fileHandle) {
          console.warn(`No file handle for ${item.name}, skipping...`);
          continue;
        }

        try {
          // Get the actual file from the handle
          const file = await item.fileHandle.getFile();
          console.log(`Reading file: ${item.name} (${(file.size / 1024).toFixed(1)} KB)`);
          
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
              color = APP_CONFIG.chartColors[i % APP_CONFIG.chartColors.length];
            }
            
            // Detect band from actual frequency data if not already detected
            let detectedBand = item.detectedBand;
            
            if (!detectedBand) {
              const frequencies = parseResult.data.map(point => point.frequency / 1e6); // Convert to MHz
              const minFreq = Math.min(...frequencies);
              const maxFreq = Math.max(...frequencies);
              detectedBand = CsvService.detectBandFromFrequencyRange(minFreq, maxFreq);
            }
            
            const dataset = {
              id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              filename: item.name,
              data: parseResult.data,
              color: color,
              frequencyData: parseResult.data.map(point => point.frequency / 1e6), // Convert to MHz
              amplitudeData: parseResult.data.map(point => point.amplitude),
              visible: true,
              label: `${item.name} (${detectedBand || 'Unknown'})`,
              panelId: panelId // Store which panel this came from
            };
            
            newDatasets.push(dataset);
            console.log(`✅ Loaded: ${item.name} with ${parseResult.data.length} data points (${detectedBand || 'Unknown band'}) from ${panelId}`);
          } else {
            console.error(`Failed to parse ${item.name}:`, parseResult.errors);
          }
        } catch (fileError) {
          console.error(`Error reading file ${item.name}:`, fileError);
        }
      }

      // Update state with all new datasets at once
      if (newDatasets.length > 0) {
        const finalDatasets = [...filteredDatasets, ...newDatasets];
        console.log(`📊 Adding ${newDatasets.length} new datasets to ${filteredDatasets.length} existing. Total: ${finalDatasets.length}`);
        updateCsvOverlayState({
          datasets: finalDatasets
        });
      }

      console.log('🎯 Files loaded successfully for', panelId);
    } catch (error) {
      console.error('Error loading files:', error);
      alert('Failed to load selected files. Please try again.');
    }
  }, [updateCsvOverlayState, csvOverlayState]);

  const renderModeContent = () => {
    switch (currentMode) {
      case 'csv':
        return (
          <div className="csv-mode-content three-panel-layout">
            {/* Left Panel - Primary Folder Browser */}
            <div className="left-panel">
              <FolderBrowser 
                panelId="dataset-a"
                title="Dataset A (Blue)"
                maxFiles={1}
                onFilesSelected={(files) => handleFilesSelected(files, 'dataset-a')}
              />
            </div>

            {/* Center Panel - Spectrum Visualization */}
            <div className="center-panel">
              <div className="panel-header">
                <h3>EMC Spectrum Analysis</h3>
                <p>Professional Data Visualization & Comparison</p>
              </div>
              <CsvVisualization 
                showControls={true}
                showLegend={true}
              />
            </div>

            {/* Right Panel - Secondary Folder Browser */}
            <div className="right-panel">
              <FolderBrowser 
                panelId="dataset-b"
                title="Dataset B (Orange)"
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
    <main className="app-main">
      <div className="main-content">
        {renderModeContent()}
      </div>
    </main>
  );
};

// ========================================================================
// APPLICATION FOOTER
// ========================================================================

const ApplicationFooter: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>&copy; 2025 {APP_CONFIG.company}. All rights reserved.</p>
        <p>Professional EMC Testing Tools | Corrected Band Ranges & Smart Detection v{APP_CONFIG.version}</p>
        <div className="attribution">
          <p>Developed by Howard Wang | Supervised by Temba Mateke</p>
        </div>
      </div>
    </footer>
  );
};

// ========================================================================
// MAIN APP COMPONENT (WITH CONTEXT)
// ========================================================================

const AppContent: React.FC = () => {
  return (
    <div className="app-container">
      <ThemeProvider>
        <ApplicationHeader />
        <ApplicationContent />
        <ApplicationFooter />
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
