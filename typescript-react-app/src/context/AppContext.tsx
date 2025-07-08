// ========================================================================
// REDA EMC Testing Tool - Application Context
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Central state management using React Context API
// ========================================================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  ApplicationState,
  ApplicationMode,
  LayoutType,
  CsvMode,
  PageData,
  CsvOverlayDataset,
  EmiCorrectionState,
  FolderSelection,
  LimitConfiguration
} from '../types';
import {
  DEFAULT_LIMIT_CONFIGURATION,
  DEFAULT_IMAGE_FORM_DATA,
  DEFAULT_CSV_FORM_DATA,
  STORAGE_KEYS
} from '../constants';

// ========================================================================
// ACTION TYPES
// ========================================================================

type AppAction =
  | { type: 'SET_MODE'; payload: ApplicationMode }
  | { type: 'SET_LAYOUT'; payload: LayoutType }
  | { type: 'SET_CSV_MODE'; payload: CsvMode }
  | { type: 'SWITCH_PAGE'; payload: number }
  | { type: 'ADD_PAGE'; payload: PageData }
  | { type: 'REMOVE_PAGE'; payload: number }
  | { type: 'UPDATE_PAGE_DATA'; payload: { pageId: number; data: Partial<PageData> } }
  | { type: 'ADD_CSV_OVERLAY_DATASET'; payload: CsvOverlayDataset }
  | { type: 'REMOVE_CSV_OVERLAY_DATASET'; payload: string }
  | { type: 'UPDATE_CSV_OVERLAY_DATASET'; payload: { id: string; data: Partial<CsvOverlayDataset> } }
  | { type: 'UPDATE_CSV_OVERLAY_STATE'; payload: Partial<typeof initialState.csvOverlayState> }
  | { type: 'UPDATE_CORRECTION_STATE'; payload: Partial<EmiCorrectionState> }
  | { type: 'UPDATE_FOLDER_SELECTION'; payload: Partial<FolderSelection> }
  | { type: 'UPDATE_LIMIT_CONFIGURATION'; payload: Partial<LimitConfiguration> }
  | { type: 'RESET_APPLICATION_STATE' }
  | { type: 'LOAD_STATE_FROM_STORAGE'; payload: Partial<ApplicationState> };

// ========================================================================
// INITIAL STATE
// ========================================================================

const createInitialPageData = (pageId: number): PageData => ({
  pageId,
  imageState1: {
    image: null,
    originalFilename: null,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    baseWidth: 0,
    baseHeight: 0
  },
  imageState2: {
    image: null,
    originalFilename: null,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    baseWidth: 0,
    baseHeight: 0
  },
  csvState1: {
    data: null,
    originalFilename: null,
    frequencyData: [],
    amplitudeData: [],
    minFreq: 0,
    maxFreq: 0,
    minAmp: 0,
    maxAmp: 0,
    rowCount: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  },
  csvState2: {
    data: null,
    originalFilename: null,
    frequencyData: [],
    amplitudeData: [],
    minFreq: 0,
    maxFreq: 0,
    minAmp: 0,
    maxAmp: 0,
    rowCount: 0,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0
  },
  formData1: { ...DEFAULT_IMAGE_FORM_DATA },
  formData2: { ...DEFAULT_IMAGE_FORM_DATA },
  csvFormData: { ...DEFAULT_CSV_FORM_DATA },
  comments: '',
  lastModified: new Date()
});

const initialState: ApplicationState = {
  currentMode: 'csv',
  currentLayout: 'horizontal',
  currentCsvMode: 'overlay',
  currentPageId: 1,
  nextPageId: 2,
  pages: new Map([[1, createInitialPageData(1)]]),
  csvOverlayState: {
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastX: 0,
    lastY: 0,
    showLegend: true,
    datasets: []
  },
  correctionState: {
    measurementData: null,
    addCorrectionData: null,
    subtractCorrectionData: null,
    correctedData: null,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  },
  limitConfiguration: { ...DEFAULT_LIMIT_CONFIGURATION },
  folderSelection: {
    folder: null,
    analyzedFiles: [],
    selectedFiles: [],
    availableFiles: [],
    currentFilter: 'all'
  }
};

// ========================================================================
// REDUCER
// ========================================================================

function appReducer(state: ApplicationState, action: AppAction): ApplicationState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        currentMode: action.payload
      };

    case 'SET_LAYOUT':
      return {
        ...state,
        currentLayout: action.payload
      };

    case 'SET_CSV_MODE':
      return {
        ...state,
        currentCsvMode: action.payload
      };

    case 'SWITCH_PAGE':
      return {
        ...state,
        currentPageId: action.payload
      };

    case 'ADD_PAGE':
      const newPages = new Map(state.pages);
      newPages.set(action.payload.pageId, action.payload);
      return {
        ...state,
        pages: newPages,
        nextPageId: Math.max(state.nextPageId, action.payload.pageId + 1)
      };

    case 'REMOVE_PAGE':
      const updatedPages = new Map(state.pages);
      updatedPages.delete(action.payload);
      
      // If removing current page, switch to another page
      let newCurrentPageId = state.currentPageId;
      if (action.payload === state.currentPageId && updatedPages.size > 0) {
        newCurrentPageId = Math.min(...Array.from(updatedPages.keys()));
      }

      return {
        ...state,
        pages: updatedPages,
        currentPageId: newCurrentPageId
      };

    case 'UPDATE_PAGE_DATA':
      const pageToUpdate = state.pages.get(action.payload.pageId);
      if (!pageToUpdate) return state;

      const updatedPageData = {
        ...pageToUpdate,
        ...action.payload.data,
        lastModified: new Date()
      };

      const newPagesMap = new Map(state.pages);
      newPagesMap.set(action.payload.pageId, updatedPageData);

      return {
        ...state,
        pages: newPagesMap
      };

    case 'ADD_CSV_OVERLAY_DATASET':
      return {
        ...state,
        csvOverlayState: {
          ...state.csvOverlayState,
          datasets: [...state.csvOverlayState.datasets, action.payload]
        }
      };

    case 'REMOVE_CSV_OVERLAY_DATASET':
      return {
        ...state,
        csvOverlayState: {
          ...state.csvOverlayState,
          datasets: state.csvOverlayState.datasets.filter(d => d.id !== action.payload)
        }
      };

    case 'UPDATE_CSV_OVERLAY_DATASET':
      return {
        ...state,
        csvOverlayState: {
          ...state.csvOverlayState,
          datasets: state.csvOverlayState.datasets.map(dataset =>
            dataset.id === action.payload.id
              ? { ...dataset, ...action.payload.data }
              : dataset
          )
        }
      };

    case 'UPDATE_CSV_OVERLAY_STATE':
      return {
        ...state,
        csvOverlayState: {
          ...state.csvOverlayState,
          ...action.payload
        }
      };

    case 'UPDATE_CORRECTION_STATE':
      return {
        ...state,
        correctionState: {
          ...state.correctionState,
          ...action.payload
        }
      };

    case 'UPDATE_FOLDER_SELECTION':
      return {
        ...state,
        folderSelection: {
          ...state.folderSelection,
          ...action.payload
        }
      };

    case 'UPDATE_LIMIT_CONFIGURATION':
      return {
        ...state,
        limitConfiguration: {
          ...state.limitConfiguration,
          ...action.payload
        }
      };

    case 'RESET_APPLICATION_STATE':
      return {
        ...initialState,
        pages: new Map([[1, createInitialPageData(1)]])
      };

    case 'LOAD_STATE_FROM_STORAGE':
      return {
        ...state,
        ...action.payload
      };

    default:
      return state;
  }
}

// ========================================================================
// CONTEXT INTERFACE
// ========================================================================

interface AppContextType {
  state: ApplicationState;
  // Mode and Layout Actions
  setMode: (mode: ApplicationMode) => void;
  setLayout: (layout: LayoutType) => void;
  setCsvMode: (mode: CsvMode) => void;
  
  // Page Management Actions
  switchToPage: (pageId: number) => void;
  addNewPage: () => number;
  removePage: (pageId: number) => void;
  updatePageData: (pageId: number, data: Partial<PageData>) => void;
  getCurrentPage: () => PageData | undefined;
  
  // CSV Overlay Actions
  addCsvOverlayDataset: (dataset: CsvOverlayDataset) => void;
  removeCsvOverlayDataset: (id: string) => void;
  updateCsvOverlayDataset: (id: string, data: Partial<CsvOverlayDataset>) => void;
  updateCsvOverlayState: (state: Partial<typeof initialState.csvOverlayState>) => void;
  
  // EMI Correction Actions
  updateCorrectionState: (state: Partial<EmiCorrectionState>) => void;
  
  // Folder Selection Actions
  updateFolderSelection: (selection: Partial<FolderSelection>) => void;
  
  // Limit Configuration Actions
  updateLimitConfiguration: (config: Partial<LimitConfiguration>) => void;
  
  // Utility Actions
  resetApplicationState: () => void;
  saveStateToStorage: () => void;
  loadStateFromStorage: () => void;
}

// ========================================================================
// CONTEXT CREATION
// ========================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

// ========================================================================
// PROVIDER COMPONENT
// ========================================================================

interface AppContextProviderProps {
  children: React.ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ========================================================================
  // ACTION CREATORS
  // ========================================================================

  const setMode = useCallback((mode: ApplicationMode) => {
    dispatch({ type: 'SET_MODE', payload: mode });
  }, []);

  const setLayout = useCallback((layout: LayoutType) => {
    dispatch({ type: 'SET_LAYOUT', payload: layout });
  }, []);

  const setCsvMode = useCallback((mode: CsvMode) => {
    dispatch({ type: 'SET_CSV_MODE', payload: mode });
  }, []);

  const switchToPage = useCallback((pageId: number) => {
    dispatch({ type: 'SWITCH_PAGE', payload: pageId });
  }, []);

  const addNewPage = useCallback((): number => {
    const newPageData = createInitialPageData(state.nextPageId);
    dispatch({ type: 'ADD_PAGE', payload: newPageData });
    return state.nextPageId;
  }, [state.nextPageId]);

  const removePage = useCallback((pageId: number) => {
    dispatch({ type: 'REMOVE_PAGE', payload: pageId });
  }, []);

  const updatePageData = useCallback((pageId: number, data: Partial<PageData>) => {
    dispatch({ type: 'UPDATE_PAGE_DATA', payload: { pageId, data } });
  }, []);

  const getCurrentPage = useCallback((): PageData | undefined => {
    return state.pages.get(state.currentPageId);
  }, [state.pages, state.currentPageId]);

  const addCsvOverlayDataset = useCallback((dataset: CsvOverlayDataset) => {
    dispatch({ type: 'ADD_CSV_OVERLAY_DATASET', payload: dataset });
  }, []);

  const removeCsvOverlayDataset = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CSV_OVERLAY_DATASET', payload: id });
  }, []);

  const updateCsvOverlayDataset = useCallback((id: string, data: Partial<CsvOverlayDataset>) => {
    dispatch({ type: 'UPDATE_CSV_OVERLAY_DATASET', payload: { id, data } });
  }, []);

  const updateCsvOverlayState = useCallback((overlayState: Partial<typeof initialState.csvOverlayState>) => {
    dispatch({ type: 'UPDATE_CSV_OVERLAY_STATE', payload: overlayState });
  }, []);

  const updateCorrectionState = useCallback((correctionState: Partial<EmiCorrectionState>) => {
    dispatch({ type: 'UPDATE_CORRECTION_STATE', payload: correctionState });
  }, []);

  const updateFolderSelection = useCallback((selection: Partial<FolderSelection>) => {
    dispatch({ type: 'UPDATE_FOLDER_SELECTION', payload: selection });
  }, []);

  const updateLimitConfiguration = useCallback((config: Partial<LimitConfiguration>) => {
    dispatch({ type: 'UPDATE_LIMIT_CONFIGURATION', payload: config });
  }, []);

  const resetApplicationState = useCallback(() => {
    dispatch({ type: 'RESET_APPLICATION_STATE' });
  }, []);

  // ========================================================================
  // PERSISTENCE FUNCTIONS
  // ========================================================================

  const saveStateToStorage = useCallback(() => {
    try {
      const stateToSave = {
        currentMode: state.currentMode,
        currentLayout: state.currentLayout,
        currentCsvMode: state.currentCsvMode,
        limitConfiguration: state.limitConfiguration,
        folderSelection: {
          ...state.folderSelection,
          folder: null // Don't persist FileList
        }
      };
      localStorage.setItem(STORAGE_KEYS.APPLICATION_STATE, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save application state to localStorage:', error);
    }
  }, [state]);

  const loadStateFromStorage = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.APPLICATION_STATE);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE_FROM_STORAGE', payload: parsedState });
      }
    } catch (error) {
      console.warn('Failed to load application state from localStorage:', error);
    }
  }, []);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Load state from localStorage on mount
  useEffect(() => {
    loadStateFromStorage();
  }, [loadStateFromStorage]);

  // Auto-save state changes to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveStateToStorage();
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(timeoutId);
  }, [state, saveStateToStorage]);

  // ========================================================================
  // CONTEXT VALUE
  // ========================================================================

  const contextValue: AppContextType = {
    state,
    setMode,
    setLayout,
    setCsvMode,
    switchToPage,
    addNewPage,
    removePage,
    updatePageData,
    getCurrentPage,
    addCsvOverlayDataset,
    removeCsvOverlayDataset,
    updateCsvOverlayDataset,
    updateCsvOverlayState,
    updateCorrectionState,
    updateFolderSelection,
    updateLimitConfiguration,
    resetApplicationState,
    saveStateToStorage,
    loadStateFromStorage
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// ========================================================================
// CUSTOM HOOK
// ========================================================================

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

// ========================================================================
// CONVENIENCE HOOKS
// ========================================================================

export const useCurrentPage = () => {
  const { getCurrentPage } = useAppContext();
  return getCurrentPage();
};

export const useCurrentMode = () => {
  const { state } = useAppContext();
  return state.currentMode;
};

export const useCsvOverlayState = () => {
  const { state, updateCsvOverlayState } = useAppContext();
  return {
    csvOverlayState: state.csvOverlayState,
    updateCsvOverlayState
  };
};

export const useCorrectionState = () => {
  const { state, updateCorrectionState } = useAppContext();
  return {
    correctionState: state.correctionState,
    updateCorrectionState
  };
};

export const useLimitConfiguration = () => {
  const { state, updateLimitConfiguration } = useAppContext();
  return {
    limitConfiguration: state.limitConfiguration,
    updateLimitConfiguration
  };
};

export const useFolderSelection = () => {
  const { state, updateFolderSelection } = useAppContext();
  return {
    folderSelection: state.folderSelection,
    updateFolderSelection
  };
}; 