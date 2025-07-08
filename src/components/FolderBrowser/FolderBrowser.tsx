// ========================================================================
// REDA EMC Testing Tool - Folder Browser Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Folder navigation component for browsing and selecting files
// ========================================================================

import React, { useState, useCallback } from 'react';
import { CsvService } from '../../services/CsvService';
import { BandType } from '../../types';
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
  const [selectedBandFilter, setSelectedBandFilter] = useState<BandType | 'all'>('all');
  const [showOnlyCSV, setShowOnlyCSV] = useState(true);
  const [selectedBands, setSelectedBands] = useState<Set<BandType>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  // ========================================================================
  // FILTERING AND BAND DETECTION
  // ========================================================================

  const applyFilters = useCallback((items: FolderItem[]) => {
    let filtered = [...items];

    // Filter by band if not 'all'
    if (selectedBandFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.type === 'folder' || 
        (item.isCSV && item.detectedBand === selectedBandFilter)
      );
    }

    setFilteredContents(filtered);
  }, [selectedBandFilter]);

  // ========================================================================
  // FOLDER NAVIGATION
  // ========================================================================

  const loadFolderContents = useCallback(async (dirHandle: any) => {
    setIsLoading(true);
    setError('');
    const items: FolderItem[] = [];

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const isFile = handle.kind === 'file';
        const isCSV = isFile ? CsvService.isValidCsvFile({ name } as File) : false;
        
        // Skip non-CSV files if showOnlyCSV is enabled
        if (showOnlyCSV && isFile && !isCSV) {
          continue;
        }

        const item: FolderItem = {
          name,
          path: `${currentPath}/${name}`,
          type: isFile ? 'file' : 'folder',
          isCSV,
          fileHandle: isFile ? handle : undefined // Store the file handle for later access
        };

        if (isFile) {
          try {
            const file = await handle.getFile();
            item.size = file.size;
            item.modified = new Date(file.lastModified);
            
            // Detect band for CSV files
            if (item.isCSV) {
              const bandFromFilename = CsvService.detectBandFromFilename(name);
              if (bandFromFilename) {
                item.detectedBand = bandFromFilename;
                item.bandConfidence = 'high';
              } else {
                // Just detect from filename for now to avoid parsing all files
                item.detectedBand = null;
                item.bandConfidence = 'low';
              }
            }
          } catch (err) {
            // Skip files we can't access
            continue;
          }
        }

        items.push(item);
      }

      // Sort: folders first, then files, alphabetically
      items.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      setFolderContents(items);
      
      // Apply filters inline to avoid dependency issues
      let filtered = [...items];
      if (selectedBandFilter !== 'all') {
        filtered = filtered.filter(item => 
          item.type === 'folder' || 
          (item.isCSV && item.detectedBand === selectedBandFilter)
        );
      }
      setFilteredContents(filtered);
    } catch (error) {
      setError('Failed to read folder contents.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPath, showOnlyCSV, selectedBandFilter]);

  const loadFolderContentsFromFiles = useCallback((files: FileList) => {
    setIsLoading(true);
    setError('');
    const items: FolderItem[] = [];
    const seenPaths = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pathParts = file.webkitRelativePath.split('/');
      
      // Add folders in the path
      for (let j = 1; j < pathParts.length - 1; j++) {
        const folderPath = pathParts.slice(0, j + 1).join('/');
        if (!seenPaths.has(folderPath)) {
          seenPaths.add(folderPath);
          items.push({
            name: pathParts[j],
            path: folderPath,
            type: 'folder'
          });
        }
      }

      // Add the file
      if (!seenPaths.has(file.webkitRelativePath)) {
        seenPaths.add(file.webkitRelativePath);
        const isCSV = CsvService.isValidCsvFile(file);
        
        // Skip non-CSV files if showOnlyCSV is enabled
        if (showOnlyCSV && !isCSV) {
          continue;
        }

        const item: FolderItem = {
          name: file.name,
          path: file.webkitRelativePath,
          type: 'file',
          size: file.size,
          modified: new Date(file.lastModified),
          isCSV
        };

        // Detect band for CSV files
        if (isCSV) {
          const bandFromFilename = CsvService.detectBandFromFilename(file.name);
          if (bandFromFilename) {
            item.detectedBand = bandFromFilename;
            item.bandConfidence = 'high';
          } else {
            item.detectedBand = null;
            item.bandConfidence = 'low';
          }
        }

        items.push(item);
      }
    }

    // Filter to show only items in current directory level
    const currentLevel = currentPath.split('/').length;
    const currentLevelItems = items.filter(item => {
      const itemLevel = item.path.split('/').length;
      return itemLevel === currentLevel + 1 && item.path.startsWith(currentPath);
    });

    setFolderContents(currentLevelItems);
    
    // Apply filters inline to avoid dependency issues
    let filtered = [...currentLevelItems];
    if (selectedBandFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.type === 'folder' || 
        (item.isCSV && item.detectedBand === selectedBandFilter)
      );
    }
    setFilteredContents(filtered);
    setIsLoading(false);
  }, [currentPath, showOnlyCSV, selectedBandFilter]);

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
      const newSelection = new Set(prev);
      let updatedBands = new Set(selectedBands);
      
      if (newSelection.has(path)) {
        // Deselecting file
        newSelection.delete(path);
        
        // Update selected bands
        if (itemBand) {
          const remainingFilesWithBand = Array.from(newSelection).some(selectedPath => {
            const item = filteredContents.find(item => item.path === selectedPath);
            return item?.detectedBand === itemBand;
          });
          
          if (!remainingFilesWithBand) {
            updatedBands.delete(itemBand);
            setSelectedBands(updatedBands);
          }
        }
      } else {
        // Selecting file
        if (newSelection.size >= maxFiles) {
          setError('Maximum number of files reached');
          return prev;
        }
        
        // Check band limitations (max 2 bands)
        if (itemBand && !updatedBands.has(itemBand)) {
          if (updatedBands.size >= 2) {
            setError('Maximum 2 bands can be compared. Please deselect files from other bands first.');
            return prev;
          }
          updatedBands.add(itemBand);
          setSelectedBands(updatedBands);
        }
        
        newSelection.add(path);
        setError(''); // Clear any previous errors
      }

      // Automatically trigger file loading when selection changes
      setTimeout(() => {
        const selectedItems = filteredContents.filter(item => 
          newSelection.has(item.path) && item.type === 'file' && item.isCSV
        );
        
        if (onFilesSelected && selectedItems.length > 0) {
          onFilesSelected(selectedItems);
        }
      }, 100); // Small delay to ensure state updates are complete
      
      return newSelection;
    });
  }, [maxFiles, selectedBands, filteredContents, onFilesSelected]);

  const selectAllCSVFiles = useCallback(() => {
    const csvFiles = filteredContents
      .filter(item => item.type === 'file' && item.isCSV)
      .slice(0, maxFiles)
      .map(item => item.path);
    
    setSelectedFiles(new Set(csvFiles));
  }, [filteredContents, maxFiles]);



  // ========================================================================
  // NAVIGATION
  // ========================================================================

  const navigateToFolder = useCallback((folderPath: string) => {
    setPathHistory(prev => [...prev, currentPath]);
    setCurrentPath(folderPath);
    setSelectedFiles(new Set());
    setSelectedBands(new Set());
    setError('');
  }, [currentPath]);

  const navigateBack = useCallback(() => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      setCurrentPath(previousPath);
      setSelectedFiles(new Set());
    }
  }, [pathHistory]);

  const navigateToRoot = useCallback(() => {
    setCurrentPath('');
    setPathHistory([]);
    setFolderContents([]);
    setSelectedFiles(new Set());
  }, []);

  // ========================================================================
  // CLEAR SELECTION
  // ========================================================================

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
    setSelectedBands(new Set());
    setError('');
    
    // Notify parent that no files are selected
    if (onFilesSelected) {
      onFilesSelected([]);
    }
  }, [onFilesSelected]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderPathBreadcrumb = () => {
    if (!currentPath) return null;

    const pathParts = currentPath.split('/');
    
    return (
      <div className="path-breadcrumb">
        <button onClick={navigateToRoot} className="breadcrumb-item root">
          Home
        </button>
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item">{part}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderFolderItem = (item: FolderItem) => {
    const isSelected = selectedFiles.has(item.path);
    const isSelectable = item.type === 'file' && item.isCSV;

    return (
      <div
        key={item.path}
        className={`folder-item ${item.type} ${isSelected ? 'selected' : ''} ${isSelectable ? 'selectable' : ''}`}
        onClick={() => {
          if (item.type === 'folder') {
            navigateToFolder(item.path);
          } else if (isSelectable) {
            toggleFileSelection(item.path, item.detectedBand);
          }
        }}
      >
        <div className="item-icon">
          {item.type === 'folder' ? '📁' : item.isCSV ? '📈' : '📄'}
        </div>
        <div className="item-details">
          <div className="item-name">{item.name}</div>
          {item.type === 'file' && (
            <div className="item-meta">
              {item.size && <span>{(item.size / 1024).toFixed(1)} KB</span>}
              {item.modified && <span>{item.modified.toLocaleDateString()}</span>}
              {item.isCSV && item.detectedBand && (
                <span className={`band-indicator ${item.bandConfidence}`}>
                  {item.detectedBand} ({BAND_DEFINITIONS[item.detectedBand].range})
                </span>
              )}
              {item.isCSV && !item.detectedBand && (
                <span className="band-indicator unknown">
                  Unknown Band
                </span>
              )}
            </div>
          )}
        </div>
        {isSelectable && (
          <div className="selection-indicator">
            <input 
              type="checkbox" 
              checked={isSelected} 
              onChange={() => toggleFileSelection(item.path, item.detectedBand)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  return (
    <div className="folder-browser" data-panel-id={panelId}>
      <div className="browser-header">
        <h3>{title}</h3>
        <div className="browser-controls">
          <button 
            onClick={openFolderDialog}
            className="open-folder-btn"
            disabled={isLoading}
          >
            Open Folder
          </button>
          {pathHistory.length > 0 && (
            <button onClick={navigateBack} className="back-btn">
              Back
            </button>
          )}
        </div>
      </div>

              {error && (
          <div className="error-message">
            {error}
          </div>
        )}

      {currentPath && (
        <>
          {renderPathBreadcrumb()}
          
          {/* Band Filter Controls */}
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
                {Object.entries(BAND_DEFINITIONS).map(([bandType, definition]) => (
                  <option key={bandType} value={bandType}>
                    {bandType}: {definition.range}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-section">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={showOnlyCSV}
                  onChange={(e) => {
                    setShowOnlyCSV(e.target.checked);
                    // Re-load current folder contents with new filter
                    if (currentPath) {
                      applyFilters(folderContents);
                    }
                  }}
                />
                                 CSV Files Only
              </label>
            </div>
          </div>

          <div className="selection-controls">
            <div className="selection-info">
              {selectedFiles.size} of {maxFiles} files selected
              {selectedBands.size > 0 && (
                <div className="selected-bands-info">
                  Comparing bands: {Array.from(selectedBands).join(', ')} 
                  {selectedBands.size === 2 && <span className="max-bands"> (Maximum reached)</span>}
                </div>
              )}
              {selectedBandFilter !== 'all' && (
                <span className="filter-info"> | Filtered by {selectedBandFilter}</span>
              )}
            </div>
            <div className="selection-actions">
              <button 
                onClick={selectAllCSVFiles}
                disabled={filteredContents.filter(item => item.isCSV).length === 0}
                className="select-all-btn"
              >
                Select All CSV
              </button>
              <button 
                onClick={clearSelection}
                disabled={selectedFiles.size === 0}
                className="clear-btn"
              >
                Clear Selection
              </button>
              <div className="auto-load-info">
                {selectedFiles.size > 0 && (
                  <span className="auto-load-text">
                    Auto-loading {selectedFiles.size} file{selectedFiles.size !== 1 ? 's' : ''} to visualization...
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="folder-contents">
        {!currentPath ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>Click "Open Folder" to browse and select CSV files</p>
          </div>
        ) : isLoading ? (
          <div className="loading-state">
            <div className="spinner">⟳</div>
            <p>Loading folder contents...</p>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="empty-folder">
            <div className="empty-icon">📂</div>
            <p>{selectedBandFilter !== 'all' ? `No CSV files found for band ${selectedBandFilter}` : 'This folder is empty'}</p>
            {selectedBandFilter !== 'all' && folderContents.length > 0 && (
              <small>Try selecting "All Bands" to see all files</small>
            )}
          </div>
        ) : (
          <>
            {/* Band Statistics */}
            {currentPath && folderContents.some(item => item.isCSV) && (
              <div className="band-statistics">
                <h4>Band Distribution:</h4>
                <div className="band-stats">
                  {Object.keys(BAND_DEFINITIONS).map(bandType => {
                    const count = folderContents.filter(item => item.detectedBand === bandType).length;
                    return count > 0 ? (
                      <span key={bandType} className="band-stat">
                        {bandType}: {count} file{count !== 1 ? 's' : ''}
                      </span>
                    ) : null;
                  })}
                  {folderContents.filter(item => item.isCSV && !item.detectedBand).length > 0 && (
                    <span className="band-stat unknown">
                      Unknown: {folderContents.filter(item => item.isCSV && !item.detectedBand).length} file(s)
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div className="items-list">
              {filteredContents.map(renderFolderItem)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FolderBrowser; 