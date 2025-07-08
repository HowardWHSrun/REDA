// ========================================================================
// REDA EMC Testing Tool - TypeScript Type Definitions
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Core type definitions for the React TypeScript migration
// ========================================================================

// ========================================================================
// CORE APPLICATION TYPES
// ========================================================================

export type ApplicationMode = 'csv' | 'images' | 'correction';
export type LayoutType = 'horizontal' | 'vertical';
export type CsvMode = 'overlay' | 'separate';

// ========================================================================
// FREQUENCY AND BAND DEFINITIONS
// ========================================================================

export type BandType = 'B0' | 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7';

export interface BandDefinition {
  range: string;
  startMHz: number;
  endMHz: number;
}

export interface FrequencyAllocation {
  startFreq: number;
  endFreq: number;
  unit: string;
  primaryService: string;
  secondaryService: string;
  usAllocations: string;
  notes: string;
  fccPart: string;
  description: string;
  band: string;
}

// ========================================================================
// IMAGE HANDLING TYPES
// ========================================================================

export interface ImageState {
  image: HTMLImageElement | null;
  originalFilename: string | null;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  baseWidth: number;
  baseHeight: number;
}

export interface ImageFormData {
  runId: string;
  band: string;
  location: string;
  testType: string;
  equipmentDescription: string;
  operatingCondition: string;
  traces: string;
}

// ========================================================================
// CSV DATA TYPES
// ========================================================================

export interface CsvDataPoint {
  frequency: number; // Hz
  amplitude: number; // dBμV/m
}

export interface CsvState {
  data: CsvDataPoint[] | null;
  originalFilename: string | null;
  frequencyData: number[];
  amplitudeData: number[];
  minFreq: number;
  maxFreq: number;
  minAmp: number;
  maxAmp: number;
  rowCount: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
}

export interface CsvFormData {
  runId: string;
  band: string;
  description: string;
  traces: string;
}

export interface CsvOverlayDataset {
  id: string;
  filename: string;
  data: CsvDataPoint[];
  color: string;
  frequencyData: number[];
  amplitudeData: number[];
  visible: boolean;
  label: string;
  panelId?: string; // Track which panel the dataset came from
}

export interface CsvOverlayState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastX: number;
  lastY: number;
  showLegend: boolean;
  datasets: CsvOverlayDataset[];
}

// ========================================================================
// EMI CORRECTION TYPES
// ========================================================================

export interface EmiCorrectionData {
  frequencies: number[]; // Hz
  corrections: number[]; // dB
  filename: string;
}

export interface EmiMeasurementData {
  filename: string;
  header: string[];
  frequencies: number[]; // Hz
  measurements: number[]; // dBμV/m
  frequenciesMHz: number[]; // MHz for visualization
}

export interface EmiCorrectedData {
  frequencies: number[];
  frequenciesMHz: number[];
  originalMeasurements: number[];
  correctedMeasurements: number[];
  addCorrections: number[];
  subtractCorrections: number[];
  netCorrections: number[];
}

export interface EmiCorrectionState {
  measurementData: EmiMeasurementData | null;
  addCorrectionData: EmiCorrectionData | null;
  subtractCorrectionData: EmiCorrectionData | null;
  correctedData: EmiCorrectedData | null;
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

// ========================================================================
// PEAK DETECTION TYPES
// ========================================================================

export interface PeakDetectionOptions {
  minProminence: number;
  minHeight: number;
  minDistance: number;
  maxPeaks: number;
}

export interface DetectedPeak {
  frequency: number; // MHz
  amplitude: number; // dBμV/m
  index: number;
  prominence: number;
  allocation?: FrequencyAllocation;
}

export interface PeakAnalysisResult {
  peaks: DetectedPeak[];
  band: BandType;
  totalPeaks: number;
  highestPeak: DetectedPeak | null;
}

// ========================================================================
// EXPORT TYPES
// ========================================================================

export interface ExportOptions {
  includeMetadata: boolean;
  includeHeader: boolean;
  format: 'png' | 'pdf' | 'csv';
  resolution: 'standard' | 'high' | 'print';
  includeWatermark: boolean;
}

export interface ExportData {
  type: 'single' | 'dual' | 'overlay';
  images?: HTMLCanvasElement[];
  csvData?: CsvOverlayDataset[];
  formData: (ImageFormData | CsvFormData)[];
  comments: string;
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  timestamp: Date;
  version: string;
  user: string;
  testConfiguration: string;
  bandInfo?: BandDefinition;
}

// ========================================================================
// CANVAS AND VISUALIZATION TYPES
// ========================================================================

export interface CanvasState {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

export interface GraphMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface AxisRange {
  min: number;
  max: number;
  autoScale: boolean;
}

export interface GraphAxisConfig {
  frequency: AxisRange;
  amplitude: AxisRange;
  margins: GraphMargins;
  showGrid: boolean;
  showLimitLines: boolean;
}

// ========================================================================
// PAGE MANAGEMENT TYPES
// ========================================================================

export interface PageData {
  pageId: number;
  imageState1: ImageState;
  imageState2: ImageState;
  csvState1: CsvState;
  csvState2: CsvState;
  formData1: ImageFormData;
  formData2: ImageFormData;
  csvFormData: CsvFormData;
  comments: string;
  lastModified: Date;
}

// ========================================================================
// FILE HANDLING TYPES
// ========================================================================

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  path?: string;
}

export interface FileAnalysis {
  filename: string;
  band: BandType | null;
  frequencyRange: {
    min: number;
    max: number;
  };
  dataPoints: number;
  isValid: boolean;
  errors: string[];
}

export interface FolderSelection {
  folder: FileList | null;
  analyzedFiles: FileAnalysis[];
  selectedFiles: string[];
  availableFiles: FileInfo[];
  currentFilter: BandType | 'all';
}

// ========================================================================
// LIMIT LINES TYPES
// ========================================================================

export interface LimitConfiguration {
  enabled: boolean;
  distance: '50ft' | '100ft';
  limits: Record<BandType, number>;
  limits100ft: Record<BandType, number>;
}

// ========================================================================
// APPLICATION STATE TYPES
// ========================================================================

export interface ApplicationState {
  currentMode: ApplicationMode;
  currentLayout: LayoutType;
  currentCsvMode: CsvMode;
  currentPageId: number;
  nextPageId: number;
  pages: Map<number, PageData>;
  csvOverlayState: CsvOverlayState;
  correctionState: EmiCorrectionState;
  limitConfiguration: LimitConfiguration;
  folderSelection: FolderSelection;
}

// ========================================================================
// EVENT TYPES
// ========================================================================

export interface MouseEventData {
  x: number;
  y: number;
  button: number;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export interface FileUploadEvent {
  files: FileList;
  targetType: 'image' | 'csv' | 'correction';
  targetIndex?: number;
}

export interface ZoomEvent {
  scale: number;
  centerX: number;
  centerY: number;
  delta: number;
}

// ========================================================================
// COMPONENT PROPS TYPES
// ========================================================================

export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export interface CanvasComponentProps extends BaseComponentProps {
  width: number;
  height: number;
  onMouseDown?: (event: MouseEventData) => void;
  onMouseMove?: (event: MouseEventData) => void;
  onMouseUp?: (event: MouseEventData) => void;
  onWheel?: (event: ZoomEvent) => void;
  onDoubleClick?: (event: MouseEventData) => void;
}

// ========================================================================
// API AND SERVICE TYPES
// ========================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

// ========================================================================
// UTILITY TYPES
// ========================================================================

export type Callback<T = void> = (data: T) => void;
export type AsyncCallback<T = void> = (data: T) => Promise<void>;
export type ErrorHandler = (error: Error) => void;

export interface Point2D {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// ========================================================================
// CONFIGURATION TYPES
// ========================================================================

export interface AppConfiguration {
  version: string;
  company: string;
  title: string;
  subtitle: string;
  maxFileSize: number;
  supportedFileTypes: string[];
  defaultBand: BandType;
  chartColors: string[];
  exportFormats: string[];
}

// ========================================================================
// VALIDATION TYPES
// ========================================================================

export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ========================================================================
// THEME TYPES
// ========================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
} 