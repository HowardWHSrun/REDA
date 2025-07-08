// ========================================================================
// REDA EMC Testing Tool - Folder Browser Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Folder navigation component for browsing and selecting files
// ========================================================================

import React, { useState, useCallback } from 'react';
import { CsvService } from '../../services/CsvService';
import { NoiseAnalysisService, NoiseAnalysisResult } from '../../services/NoiseAnalysisService';
import { BandType, CsvDataPoint } from '../../types';
import { BAND_DEFINITIONS } from '../../constants';
import './FolderBrowser.css';

// ========================================================================
// INTERFACES
// ========================================================================

interface FolderItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modified?: Date;
  isCSV?: boolean;
  detectedBand?: BandType | null;
  bandConfidence?: 'high' | 'medium' | 'low';
  fileHandle?: any; // File handle for File System Access API
  noisinessAnalysis?: NoiseAnalysisResult; // Noisiness analysis data
}

interface FolderBrowserProps {
  panelId: string;
  title: string;
  maxFiles?: number;
  onFilesSelected?: (files: FolderItem[]) => void;
}

// ========================================================================
// FOLDER BROWSER COMPONENT
// ========================================================================

export const FolderBrowser: React.FC<FolderBrowserProps> = ({
  panelId,
  title,
  maxFiles = 8,
  onFilesSelected
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [folderContents, setFolderContents] = useState<FolderItem[]>([]);
  const [filteredContents, setFilteredContents] = useState<FolderItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedBandFilter, setSelectedBandFilter] = useState<BandType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'noisiness'>('noisiness');
  const [isAnalyzingNoise, setIsAnalyzingNoise] = useState<boolean>(false);

  // ========================================================================
  // NOISINESS ANALYSIS
  // ========================================================================

  const batchAnalyzeNoisiness = useCallback(async (items: FolderItem[]) => {
    const csvFiles = items.filter(item => item.isCSV && item.fileHandle);
    if (csvFiles.length === 0) return;

    setIsAnalyzingNoise(true);
    console.log(`🔊 Analyzing band-relative noisiness for ${csvFiles.length} CSV files...`);

    // Parse all CSV files first
    const filesData: Array<{ filename: string; data: CsvDataPoint[]; band?: string; item: FolderItem }> = [];
    
    for (const item of csvFiles) {
      try {
        const file = await item.fileHandle!.getFile();
        const parseResult = await CsvService.parseCsvFile(file);
        
        if (parseResult.success && parseResult.data) {
          // Detect band from frequency data if not already detected
          let detectedBand = item.detectedBand;
          if (!detectedBand) {
            const frequencies = parseResult.data.map(point => point.frequency / 1e6);
            const minFreq = Math.min(...frequencies);
            const maxFreq = Math.max(...frequencies);
            detectedBand = CsvService.detectBandFromFrequencyRange(minFreq, maxFreq);
          }
          
          filesData.push({
            filename: item.name,
            data: parseResult.data,
            band: detectedBand || 'Unknown',
            item
          });
        }
      } catch (error) {
        console.warn(`Failed to parse ${item.name}:`, error);
      }
    }
    
    if (filesData.length === 0) {
      setIsAnalyzingNoise(false);
      return;
    }

    // Use band-relative noisiness analysis
    const analyses = NoiseAnalysisService.calculateBandRelativeNoisiness(filesData);
    
    // Update items with analysis results
    const updatedItems = [...items];
    analyses.forEach(analysis => {
      const fileData = filesData.find(fd => fd.filename === analysis.filename);
      if (fileData) {
        const itemIndex = updatedItems.findIndex(ui => ui.path === fileData.item.path);
        if (itemIndex >= 0) {
          updatedItems[itemIndex] = { 
            ...updatedItems[itemIndex], 
            noisinessAnalysis: analysis,
            detectedBand: fileData.band as any // Update band if it was detected
          };
        }
      }
    });
    
    setFolderContents(updatedItems);
    setIsAnalyzingNoise(false);
    
    console.log(`✅ Band-relative noisiness analysis complete for ${csvFiles.length} files`);
    console.log(`📊 Results: Files now ranked 1-10 within their respective bands (1=quietest, 10=noisiest)`);
  }, []);

  // ========================================================================
  // FILTERING AND BAND DETECTION
  // ========================================================================

  const applyFilters = useCallback((allItems: FolderItem[]) => {
    let filtered = [...allItems];
    
    // Band filter (only CSV files, no folders to worry about)
    if (selectedBandFilter !== 'all') {
      filtered = filtered.filter(item => item.detectedBand === selectedBandFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'noisiness') {
        const aNoise = a.noisinessAnalysis?.noisinessIndex || 0;
        const bNoise = b.noisinessAnalysis?.noisinessIndex || 0;
        return bNoise - aNoise; // Highest first
      }
      
      // Default: sort by name
      return a.name.localeCompare(b.name);
    });

    setFilteredContents(filtered);
  }, [selectedBandFilter, sortBy]);

  // Apply filters whenever band filter, sort option, or folder contents change
  React.useEffect(() => {
    applyFilters(folderContents);
  }, [folderContents, selectedBandFilter, sortBy, applyFilters]);

  // ========================================================================
  // FOLDER NAVIGATION
  // ========================================================================

  const loadFolderContents = useCallback(async (dirHandle: any) => {
    setIsLoading(true);
    setError('');
    const items: FolderItem[] = [];

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        // Only process files, skip folders
        if (handle.kind !== 'file') {
          continue;
        }
        
        // Only include CSV files
        const isCSV = CsvService.isValidCsvFile({ name } as File);
        if (!isCSV) {
          continue;
        }

        const item: FolderItem = {
          name,
          path: name, // Simplified - just the filename
          type: 'file',
          isCSV: true,
          fileHandle: handle
        };

        try {
          const file = await handle.getFile();
          item.size = file.size;
          item.modified = new Date(file.lastModified);
          
          // Detect band for CSV files
          const bandFromFilename = CsvService.detectBandFromFilename(name);
          if (bandFromFilename) {
            item.detectedBand = bandFromFilename;
            item.bandConfidence = 'high';
          } else {
            item.detectedBand = null;
            item.bandConfidence = 'low';
          }
        } catch (err) {
          // Skip files we can't access
          continue;
        }

        items.push(item);
      }

      // Simple alphabetical sort
      items.sort((a, b) => a.name.localeCompare(b.name));

      setFolderContents(items);
      setFilteredContents(items); // No filtering needed initially
      
      // Start noisiness analysis for CSV files in the background
      setTimeout(() => batchAnalyzeNoisiness(items), 100);
    } catch (error) {
      setError('Failed to read folder contents.');
    } finally {
      setIsLoading(false);
    }
  }, [batchAnalyzeNoisiness]);

  const loadFolderContentsFromFiles = useCallback((files: FileList) => {
    setIsLoading(true);
    setError('');
    const items: FolderItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Only include CSV files
      const isCSV = CsvService.isValidCsvFile(file);
      if (!isCSV) {
        continue;
      }

      const item: FolderItem = {
        name: file.name,
        path: file.name, // Simplified - just the filename
        type: 'file',
        size: file.size,
        modified: new Date(file.lastModified),
        isCSV: true
      };

      // Detect band for CSV files
      const bandFromFilename = CsvService.detectBandFromFilename(file.name);
      if (bandFromFilename) {
        item.detectedBand = bandFromFilename;
        item.bandConfidence = 'high';
      } else {
        item.detectedBand = null;
        item.bandConfidence = 'low';
      }

      items.push(item);
    }

    // Simple alphabetical sort
    items.sort((a, b) => a.name.localeCompare(b.name));

    setFolderContents(items);
    setFilteredContents(items); // No filtering needed initially
    setIsLoading(false);
  }, []);

  const openFolderDialog = useCallback(async () => {
    try {
      // Use the File System Access API for modern browsers
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const path = dirHandle.name;
        setCurrentPath(path);
        await loadFolderContents(dirHandle);
      } else {
        // Fallback: use input element
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files;
          if (files && files.length > 0) {
            const firstFile = files[0];
            const pathParts = firstFile.webkitRelativePath.split('/');
            const folderName = pathParts[0];
            setCurrentPath(folderName);
            loadFolderContentsFromFiles(files);
          }
        };
        
        input.click();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setError('Failed to open folder. Please try again.');
      }
    }
  }, [loadFolderContents, loadFolderContentsFromFiles]);

  // ========================================================================
  // FILE SELECTION
  // ========================================================================

  const toggleFileSelection = useCallback((path: string, itemBand?: BandType | null) => {
    setSelectedFiles(prev => {
      const newSelection = new Set<string>();
      
      if (prev.has(path)) {
        // Deselecting the currently selected file - clear everything
        newSelection.clear();
        console.log(`🗑️ Deselected file: ${path}`);
      } else {
        // Selecting a new file - replace any previous selection
        newSelection.clear(); // Clear any previous selections
        newSelection.add(path); // Add only the new file
        
        if (itemBand) {
          console.log(`🔄 Selected new file: ${path} (${itemBand} band) - replacing any previous selection`);
        } else {
          console.log(`🔄 Selected new file: ${path} (Unknown band) - replacing any previous selection`);
        }
        
        setError(''); // Clear any previous errors
      }

      // Always trigger file loading when selection changes (including when clearing)
      setTimeout(() => {
        const selectedItems = filteredContents.filter(item => 
          newSelection.has(item.path) && item.type === 'file' && item.isCSV
        );
        
        // Always call the callback, even when no files are selected (to clear the plot)
        if (onFilesSelected) {
          onFilesSelected(selectedItems);
        }
      }, 100); // Small delay to ensure state updates are complete
      
      return newSelection;
    });
  }, [filteredContents, onFilesSelected]);

  // ========================================================================
  // CLEAR SELECTION
  // ========================================================================

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setError('');
    
    // Notify parent that no files are selected
    if (onFilesSelected) {
      onFilesSelected([]);
    }
  }, [onFilesSelected]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  // const renderPathBreadcrumb = () => {
  //   // Removed - not using breadcrumb navigation anymore
  // };

  const renderFolderItem = (item: FolderItem) => {
    const isSelected = selectedFiles.has(item.path);
    // All items are CSV files and selectable - no need for isSelectable variable

    return (
      <div
        key={item.path}
        className={`folder-item file ${isSelected ? 'selected' : ''} selectable`}
        onClick={() => toggleFileSelection(item.path, item.detectedBand)}
      >
        <div className="item-details">
          <div className="item-name">{item.name}</div>
          <div className="item-meta">
            <div className="band-info">
              {item.detectedBand && (
                <span className={`band-indicator ${item.bandConfidence}`}>
                  {item.detectedBand}
                </span>
              )}
              {!item.detectedBand && (
                <span className="band-indicator unknown">
                  Unknown
                </span>
              )}
            </div>
            {item.noisinessAnalysis && (
              <div className="noisiness-info">
                <span 
                  className="noisiness-indicator"
                  style={{ color: NoiseAnalysisService.getNoisinessColor(item.noisinessAnalysis.noisinessIndex) }}
                  title={`Noisiness: ${item.noisinessAnalysis.noisinessIndex}/10 (${NoiseAnalysisService.getNoisinessDescription(item.noisinessAnalysis.noisinessIndex)})`}
                >
                  {item.noisinessAnalysis.noisinessIndex}
                </span>
              </div>
            )}
            {!item.noisinessAnalysis && isAnalyzingNoise && (
              <div className="noisiness-info">
                <span className="noisiness-loading">...</span>
              </div>
            )}
          </div>
        </div>
        <div className="selection-indicator">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={() => toggleFileSelection(item.path, item.detectedBand)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="folder-browser" data-panel-id={panelId}>
      <div className="browser-header">
        <h3 
          onClick={!isLoading ? openFolderDialog : undefined}
          style={{ 
            cursor: !isLoading ? 'pointer' : 'default',
            userSelect: 'none',
            color: !currentPath ? 'inherit' : 'inherit',
            transition: 'all 0.2s ease'
          }}
          title={!currentPath ? 'Click to open folder' : `Current folder: ${currentPath}. Click to change.`}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.opacity = '0.7';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          {title}
          {currentPath ? ` - ${currentPath}` : ''}
        </h3>
        {currentPath && (
          <div className="browser-controls">
            <button 
              onClick={openFolderDialog}
              className="open-folder-btn"
              disabled={isLoading}
            >
              Change Folder
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {currentPath && (
        <>
          {/* {renderPathBreadcrumb()} - Removed for cleaner UI */}
          
          {/* Filter and Sort Controls */}
          <div className="filter-controls">
            <div className="filter-section">
              <label htmlFor={`band-filter-${panelId}`} className="filter-label">
                Band Filter:
              </label>
              <select
                id={`band-filter-${panelId}`}
                value={selectedBandFilter}
                onChange={(e) => {
                  setSelectedBandFilter(e.target.value as BandType | 'all');
                  applyFilters(folderContents);
                }}
                className="band-filter-select"
              >
                <option value="all">All Bands</option>
                {Object.entries(BAND_DEFINITIONS).map(([bandType, definition]) => {
                  const count = folderContents.filter(item => item.detectedBand === bandType).length;
                  return (
                    <option key={bandType} value={bandType}>
                      {bandType}: {definition.range} ({count} files)
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="filter-section">
              <label htmlFor={`sort-filter-${panelId}`} className="filter-label">
                Sort by:
              </label>
              <select
                id={`sort-filter-${panelId}`}
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'name' | 'noisiness');
                  applyFilters(folderContents);
                }}
                className="sort-filter-select"
              >
                <option value="noisiness">Noisiness (High→Low)</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="action-section">
              {isAnalyzingNoise && (
                <span className="analysis-status">
                  Analyzing...
                </span>
              )}
              <button 
                onClick={clearSelection}
                disabled={selectedFiles.size === 0}
                className="clear-all-btn"
              >
                {selectedFiles.size > 0 ? 'Clear Selection' : 'Clear All'}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="folder-contents">
        {!currentPath ? (
          <div className="empty-state" onClick={openFolderDialog}>
            <div className="empty-icon"></div>
            <p>Select Your {title} Folder</p>
            <div className="empty-subtitle">Click here to browse and select CSV files for {panelId === 'dataset-a' ? 'primary' : 'comparison'} analysis</div>
          </div>
        ) : isLoading ? (
          <div className="loading-state">
            <div className="spinner">Loading...</div>
            <p>Loading folder contents...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="empty-folder">
            <div className="empty-icon"></div>
            <p>{selectedBandFilter !== 'all' ? `No CSV files found for band ${selectedBandFilter}` : 'No CSV files found'}</p>
            {selectedBandFilter !== 'all' && folderContents.length > 0 && (
              <small>Try selecting "All Bands" to see all files</small>
            )}
          </div>
        ) : (
          <div className="items-list">
            {filteredContents.map(renderFolderItem)}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderBrowser; 