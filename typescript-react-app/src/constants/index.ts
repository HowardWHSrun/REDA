// ========================================================================
// REDA EMC Testing Tool - Constants and Configuration
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Application constants, band definitions, and configuration data
// ========================================================================

import { BandType, BandDefinition, LimitConfiguration, AppConfiguration, ThemeColors, Theme } from '../types';

// ========================================================================
// APPLICATION CONFIGURATION
// ========================================================================

export const APP_CONFIG: AppConfiguration = {
  version: "4.1",
  company: "Turner Engineering Corporation",
  title: "Figure Export Tool v4.1",
  subtitle: "Professional EMC Testing Annotation System",
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedFileTypes: [
    'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp',
    'text/csv', 'application/csv', 'text/plain'
  ],
  defaultBand: 'B6',
  chartColors: [
    '#cc0000', // Red
    '#0066cc', // Blue
    '#00cc66', // Green
    '#cc6600', // Orange
    '#6600cc', // Purple
    '#cc0066', // Pink
    '#006666', // Teal
    '#666600'  // Olive
  ],
  exportFormats: ['png', 'pdf', 'csv']
};

// ========================================================================
// BAND DEFINITIONS FOR EMC TESTING
// ========================================================================

export const BAND_DEFINITIONS: Record<BandType, BandDefinition> = {
  'B0': { range: '10 kHz – 160 kHz', startMHz: 0.01, endMHz: 0.16 },
  'B1': { range: '150 kHz – 650 kHz', startMHz: 0.15, endMHz: 0.65 },
  'B2': { range: '500 kHz – 3 MHz', startMHz: 0.5, endMHz: 3 },
  'B3': { range: '2.5 MHz – 7.5 MHz', startMHz: 2.5, endMHz: 7.5 },
  'B4': { range: '5 MHz – 30 MHz', startMHz: 5, endMHz: 30 },
  'B5': { range: '25 MHz – 325 MHz', startMHz: 25, endMHz: 325 },
  'B6': { range: '300 MHz – 1.3 GHz', startMHz: 300, endMHz: 1300 },
  'B7': { range: '1 GHz – 6 GHz', startMHz: 1000, endMHz: 6000 }
};

// ========================================================================
// EMISSION LIMIT LINES CONFIGURATION
// ========================================================================

export const DEFAULT_LIMIT_CONFIGURATION: LimitConfiguration = {
  enabled: true,
  distance: '50ft',
  // NYCT AC Train Radiated Emission Limits at 50 ft (dBμV/m/MHz)
  limits: {
    'B0': 126,   // 10 kHz – 160 kHz
    'B1': 126,   // 150 kHz – 650 kHz
    'B2': 115,   // 500 kHz – 3 MHz
    'B3': 100,   // 2.5 MHz – 7.5 MHz
    'B4': 85,    // 5 MHz – 30 MHz
    'B5': 81,    // 25 MHz – 325 MHz
    'B6': 96,    // 300 MHz – 1.3 GHz
    'B7': 96     // 1 GHz – 6 GHz
  },
  // NYCT AC Train Radiated Emission Limits at 100 ft (dBμV/m/MHz)
  limits100ft: {
    'B0': 108,   // 10 kHz – 160 kHz
    'B1': 108,   // 150 kHz – 650 kHz
    'B2': 97,    // 500 kHz – 3 MHz
    'B3': 94,    // 2.5 MHz – 7.5 MHz
    'B4': 84,    // 5 MHz – 30 MHz
    'B5': 75,    // 25 MHz – 325 MHz
    'B6': 90,    // 300 MHz – 1.3 GHz
    'B7': 90     // 1 GHz – 6 GHz
  }
};

// ========================================================================
// THEME CONFIGURATIONS
// ========================================================================

export const CSV_THEME_COLORS: ThemeColors = {
  primary: '#1e3a8a',      // Deep blue
  secondary: '#334260',     // Navy blue
  background: '#f0f2f5',    // Light gray
  surface: '#ffffff',       // White
  text: '#000000',          // Black
  textSecondary: '#666666', // Dark gray
  border: '#e9ecef',        // Light border
  success: '#28a745',       // Green
  warning: '#ffc107',       // Yellow
  error: '#dc3545'          // Red
};

export const IMAGE_THEME_COLORS: ThemeColors = {
  primary: '#1a472a',       // Dark green
  secondary: '#2d5a32',     // Medium green
  background: '#f0f2f5',    // Light gray
  surface: '#ffffff',       // White
  text: '#000000',          // Black
  textSecondary: '#666666', // Dark gray
  border: '#e9ecef',        // Light border
  success: '#28a745',       // Green
  warning: '#ffc107',       // Yellow
  error: '#dc3545'          // Red
};

export const CORRECTION_THEME_COLORS: ThemeColors = {
  primary: '#b8860b',       // Dark goldenrod
  secondary: '#daa520',     // Goldenrod
  background: '#fffaf0',    // Floral white
  surface: '#ffffff',       // White
  text: '#000000',          // Black
  textSecondary: '#666666', // Dark gray
  border: '#e9ecef',        // Light border
  success: '#28a745',       // Green
  warning: '#ffc107',       // Yellow
  error: '#dc3545'          // Red
};

export const CSV_THEME: Theme = {
  name: 'csv',
  colors: CSV_THEME_COLORS,
  typography: {
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '2rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  }
};

export const IMAGE_THEME: Theme = {
  name: 'image',
  colors: IMAGE_THEME_COLORS,
  typography: {
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '2rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  }
};

export const CORRECTION_THEME: Theme = {
  name: 'correction',
  colors: CORRECTION_THEME_COLORS,
  typography: {
    fontFamily: "'Segoe UI', 'Arial', sans-serif",
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem',
      xlarge: '2rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  }
};

// ========================================================================
// FILE TYPE CONSTANTS
// ========================================================================

export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/bmp',
  'image/webp'
];

export const SUPPORTED_CSV_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain',
  'application/vnd.ms-excel'
];

export const SUPPORTED_CORRECTION_TYPES = [
  'text/csv',
  'application/csv',
  'text/plain'
];

// ========================================================================
// CANVAS AND VISUALIZATION CONSTANTS
// ========================================================================

export const DEFAULT_CANVAS_SIZE = {
  width: 800,
  height: 600
};

export const DEFAULT_GRAPH_MARGINS = {
  top: 60,
  right: 50,
  bottom: 80,
  left: 80
};

export const ZOOM_LIMITS = {
  min: 0.1,
  max: 10.0,
  step: 0.1
};

export const PAN_LIMITS = {
  maxOffset: 2000
};

// ========================================================================
// PEAK DETECTION CONSTANTS
// ========================================================================

export const DEFAULT_PEAK_DETECTION_OPTIONS = {
  minProminence: 3.0,  // dB
  minHeight: -120,     // dBμV/m
  minDistance: 10,     // data points
  maxPeaks: 50
};

// ========================================================================
// EXPORT CONSTANTS
// ========================================================================

export const EXPORT_RESOLUTIONS = {
  standard: { width: 1920, height: 1080, dpi: 72 },
  high: { width: 3840, height: 2160, dpi: 150 },
  print: { width: 7680, height: 4320, dpi: 300 }
};

// ========================================================================
// ERROR MESSAGES
// ========================================================================

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `File size exceeds maximum limit of ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB`,
  UNSUPPORTED_FILE_TYPE: 'Unsupported file type. Please select a valid file.',
  INVALID_CSV_FORMAT: 'Invalid CSV format. Please check your file structure.',
  NO_DATA_FOUND: 'No valid data found in the file.',
  FREQUENCY_OUT_OF_RANGE: 'Frequency value is outside the valid range for this band.',
  EXPORT_FAILED: 'Export operation failed. Please try again.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection.',
  PERMISSION_DENIED: 'Permission denied. Please check file access permissions.'
};

// ========================================================================
// SUCCESS MESSAGES
// ========================================================================

export const SUCCESS_MESSAGES = {
  FILE_UPLOADED: 'File uploaded successfully',
  DATA_PROCESSED: 'Data processed successfully',
  EXPORT_COMPLETED: 'Export completed successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  PEAK_DETECTION_COMPLETED: 'Peak detection completed',
  CORRECTION_APPLIED: 'EMI correction applied successfully'
};

// ========================================================================
// BAND INFORMATION AND DESCRIPTIONS
// ========================================================================

export const BAND_DESCRIPTIONS: Record<BandType, string> = {
  'B0': 'Very Low Frequency (VLF) and Low Frequency (LF) - Standard time signals, maritime navigation',
  'B1': 'Medium Frequency (MF) - AM broadcasting, maritime communications, amateur radio',
  'B2': 'High Frequency (HF) Lower - Extended AM broadcasting, amateur radio, maritime mobile',
  'B3': 'High Frequency (HF) Core - WWV time signals, amateur radio, international broadcasting',
  'B4': 'Upper High Frequency (HF) - Amateur radio, citizens band, ISM applications',
  'B5': 'Very High Frequency (VHF) - FM broadcasting, TV VHF, aviation, amateur radio',
  'B6': 'Ultra High Frequency (UHF) Lower - UHF TV, cellular, amateur radio, GPS',
  'B7': 'Super High Frequency (SHF) - GPS, cellular/PCS, WiFi, amateur radio'
};

// ========================================================================
// KEYBOARD SHORTCUTS
// ========================================================================

export const KEYBOARD_SHORTCUTS = {
  ZOOM_IN: 'Ctrl+=',
  ZOOM_OUT: 'Ctrl+-',
  RESET_ZOOM: 'Ctrl+0',
  FIT_TO_SCREEN: 'Ctrl+F',
  EXPORT: 'Ctrl+E',
  SAVE: 'Ctrl+S',
  NEW_PAGE: 'Ctrl+N',
  CLOSE_PAGE: 'Ctrl+W',
  FULL_SCREEN: 'F11',
  TOGGLE_LEGEND: 'L',
  PEAK_DETECTION: 'P'
};

// ========================================================================
// API ENDPOINTS (if needed for future backend integration)
// ========================================================================

export const API_ENDPOINTS = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  UPLOAD_FILE: '/api/upload',
  PROCESS_CSV: '/api/process-csv',
  EXPORT_DATA: '/api/export',
  GET_ALLOCATIONS: '/api/allocations',
  SAVE_SESSION: '/api/session/save',
  LOAD_SESSION: '/api/session/load'
};

// ========================================================================
// LOCAL STORAGE KEYS
// ========================================================================

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'reda_user_preferences',
  RECENT_FILES: 'reda_recent_files',
  EXPORT_SETTINGS: 'reda_export_settings',
  PEAK_DETECTION_SETTINGS: 'reda_peak_detection_settings',
  LIMIT_CONFIGURATION: 'reda_limit_configuration',
  APPLICATION_STATE: 'reda_application_state'
};

// ========================================================================
// DEFAULT FORM VALUES
// ========================================================================

export const DEFAULT_IMAGE_FORM_DATA = {
  runId: '',
  band: '',
  location: '',
  testType: '',
  equipmentDescription: '',
  operatingCondition: '',
  traces: 'Top - maximum peak hold\nBottom - minimum peak hold'
};

export const DEFAULT_CSV_FORM_DATA = {
  runId: '',
  band: '',
  description: '',
  traces: ''
};

// ========================================================================
// VALIDATION PATTERNS
// ========================================================================

export const VALIDATION_PATTERNS = {
  RUN_ID: /^[A-Za-z0-9\-_]{1,20}$/,
  BAND: /^B[0-7]$/,
  FREQUENCY: /^\d+(\.\d+)?$/,
  // eslint-disable-next-line no-control-regex
  FILE_NAME: /^[^<>:"/\\|?*\x00-\x1f]+$/
};

// ========================================================================
// ACCESSIBILITY CONSTANTS
// ========================================================================

export const ARIA_LABELS = {
  MAIN_NAVIGATION: 'Main navigation',
  FILE_UPLOAD: 'Upload file',
  ZOOM_CONTROLS: 'Zoom controls',
  EXPORT_MENU: 'Export menu',
  PEAK_DETECTION: 'Peak detection controls',
  FREQUENCY_CHART: 'Frequency spectrum chart',
  BAND_SELECTOR: 'Band selector',
  MODE_SWITCHER: 'Application mode switcher'
};

// ========================================================================
// CHART CONFIGURATION
// ========================================================================

export const CHART_CONFIG = {
  animationDuration: 300,
  gridLineColor: '#e0e0e0',
  axisLineColor: '#333333',
  labelColor: '#666666',
  legendPosition: 'bottom' as const,
  tooltipBackgroundColor: '#333333',
  tooltipTextColor: '#ffffff'
};

// ========================================================================
// PERFORMANCE CONSTANTS
// ========================================================================

export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,        // ms
  THROTTLE_DELAY: 16,         // ms (60fps)
  MAX_DATA_POINTS: 100000,    // Maximum points to render
  CHUNK_SIZE: 1000,           // Data processing chunk size
  RENDER_THRESHOLD: 10000     // Point threshold for performance optimization
}; 