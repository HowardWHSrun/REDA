// ========================================================================
// REDA EMC Testing Tool - CSV Service
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Service for CSV file processing, data parsing, and analysis
// ========================================================================

import Papa from 'papaparse';
import {
  CsvDataPoint,
  CsvOverlayDataset,
  FileAnalysis,
  BandType,
  ServiceResult,
  FileInfo,
  DetectedPeak,
  PeakDetectionOptions
} from '../types';
import {
  BAND_DEFINITIONS,
  APP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  DEFAULT_PEAK_DETECTION_OPTIONS,
  SUPPORTED_CSV_TYPES
} from '../constants';

// ========================================================================
// CSV PARSING AND VALIDATION
// ========================================================================

export class CsvService {
  /**
   * Parse CSV file content and extract frequency/amplitude data
   */
  static async parseCsvFile(file: File): Promise<ServiceResult<CsvDataPoint[]>> {
    const result: ServiceResult<CsvDataPoint[]> = {
      success: false,
      data: undefined,
      errors: [],
      warnings: []
    };

    try {
      // Validate file type
      if (!this.isValidCsvFile(file)) {
        result.errors.push(ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE);
        return result;
      }

      // Validate file size
      if (file.size > APP_CONFIG.maxFileSize) {
        result.errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
        return result;
      }

      // Parse CSV content
      const csvText = await this.readFileAsText(file);
      const parseResult = await this.parseCsvText(csvText);

      if (!parseResult.success || !parseResult.data) {
        result.errors.push(...parseResult.errors);
        return result;
      }

      result.success = true;
      result.data = parseResult.data;
      result.warnings = parseResult.warnings;

    } catch (error) {
      result.errors.push(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Parse CSV text content
   */
  static async parseCsvText(csvText: string): Promise<ServiceResult<CsvDataPoint[]>> {
    const result: ServiceResult<CsvDataPoint[]> = {
      success: false,
      data: undefined,
      errors: [],
      warnings: []
    };

    try {
      // Find data start line (look for "DATA" marker)
      const lines = csvText.split('\n');
      let dataStartIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === 'DATA' || line === 'DATA,') {
          dataStartIndex = i + 1;
          break;
        }
      }

      // If no DATA marker found, assume data starts from first line
      if (dataStartIndex === -1) {
        dataStartIndex = 0;
        result.warnings.push('No DATA marker found. Processing from first line.');
      }

      // Parse data lines
      const dataPoints: CsvDataPoint[] = [];
      let validRows = 0;
      let invalidRows = 0;

      for (let i = dataStartIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#') || line.startsWith('//')) {
          continue; // Skip empty lines and comments
        }

        const parts = line.split(',');
        if (parts.length >= 2) {
          const frequency = this.parseNumber(parts[0]);
          const amplitude = this.parseNumber(parts[1]);

          if (!isNaN(frequency) && !isNaN(amplitude)) {
            dataPoints.push({
              frequency: frequency, // Hz
              amplitude: amplitude  // dBμV/m
            });
            validRows++;
          } else {
            invalidRows++;
          }
        } else {
          invalidRows++;
        }
      }

      if (dataPoints.length === 0) {
        result.errors.push(ERROR_MESSAGES.NO_DATA_FOUND);
        return result;
      }

      if (invalidRows > 0) {
        result.warnings.push(`${invalidRows} invalid rows were skipped`);
      }

      // Sort by frequency
      dataPoints.sort((a, b) => a.frequency - b.frequency);

      result.success = true;
      result.data = dataPoints;

    } catch (error) {
      result.errors.push(`Failed to parse CSV text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Analyze CSV file for band detection and validation
   */
  static analyzeFile(file: File, csvData?: CsvDataPoint[]): FileAnalysis {
    const analysis: FileAnalysis = {
      filename: file.name,
      band: null,
      frequencyRange: { min: 0, max: 0 },
      dataPoints: 0,
      isValid: false,
      errors: []
    };

    try {
      // Basic file validation
      if (!this.isValidCsvFile(file)) {
        analysis.errors.push('Invalid file type');
        return analysis;
      }

      if (file.size > APP_CONFIG.maxFileSize) {
        analysis.errors.push('File too large');
        return analysis;
      }

      // If CSV data is provided, analyze it
      if (csvData && csvData.length > 0) {
        const frequencies = csvData.map(point => point.frequency / 1e6); // Convert to MHz
        analysis.frequencyRange.min = Math.min(...frequencies);
        analysis.frequencyRange.max = Math.max(...frequencies);
        analysis.dataPoints = csvData.length;
        analysis.band = this.detectBandFromFrequencyRange(
          analysis.frequencyRange.min,
          analysis.frequencyRange.max
        );
        analysis.isValid = true;
      } else {
        // Try to detect band from filename
        analysis.band = this.detectBandFromFilename(file.name);
      }

    } catch (error) {
      analysis.errors.push(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return analysis;
  }

  /**
   * Create CSV overlay dataset from file
   */
  static async createOverlayDataset(
    file: File,
    color: string,
    label?: string
  ): Promise<ServiceResult<CsvOverlayDataset>> {
    const result: ServiceResult<CsvOverlayDataset> = {
      success: false,
      data: undefined,
      errors: [],
      warnings: []
    };

    try {
      const parseResult = await this.parseCsvFile(file);
      
      if (!parseResult.success || !parseResult.data) {
        result.errors.push(...parseResult.errors);
        return result;
      }

      const data = parseResult.data;
      const frequencyData = data.map(point => point.frequency / 1e6); // Convert to MHz
      const amplitudeData = data.map(point => point.amplitude);

      const dataset: CsvOverlayDataset = {
        id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.name,
        data: data,
        color: color,
        frequencyData: frequencyData,
        amplitudeData: amplitudeData,
        visible: true,
        label: label || file.name
      };

      result.success = true;
      result.data = dataset;
      result.warnings = parseResult.warnings;

    } catch (error) {
      result.errors.push(`Failed to create overlay dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // ========================================================================
  // PEAK DETECTION
  // ========================================================================

  /**
   * Detect peaks in CSV data
   */
  static detectPeaks(
    data: CsvDataPoint[],
    options: PeakDetectionOptions = DEFAULT_PEAK_DETECTION_OPTIONS
  ): DetectedPeak[] {
    if (data.length < 3) return [];

    const peaks: DetectedPeak[] = [];
    const amplitudes = data.map(point => point.amplitude);
    const frequencies = data.map(point => point.frequency / 1e6); // Convert to MHz

    // Find local maxima
    for (let i = 1; i < data.length - 1; i++) {
      const current = amplitudes[i];
      const prev = amplitudes[i - 1];
      const next = amplitudes[i + 1];

      // Check if it's a local maximum
      if (current > prev && current > next && current >= options.minHeight) {
        const prominence = this.calculateProminence(amplitudes, i);
        
        if (prominence >= options.minProminence) {
          // Check minimum distance from other peaks
          const tooClose = peaks.some(peak => 
            Math.abs(peak.index - i) < options.minDistance
          );

          if (!tooClose) {
            peaks.push({
              frequency: frequencies[i],
              amplitude: current,
              index: i,
              prominence: prominence
            });
          }
        }
      }
    }

    // Sort by prominence (highest first) and limit to maxPeaks
    return peaks
      .sort((a, b) => b.prominence - a.prominence)
      .slice(0, options.maxPeaks);
  }

  /**
   * Calculate prominence of a peak
   */
  private static calculateProminence(amplitudes: number[], peakIndex: number): number {
    const peakValue = amplitudes[peakIndex];
    let leftMin = peakValue;
    let rightMin = peakValue;

    // Search left for minimum
    for (let i = peakIndex - 1; i >= 0; i--) {
      if (amplitudes[i] < leftMin) {
        leftMin = amplitudes[i];
      }
      if (amplitudes[i] > peakValue) break;
    }

    // Search right for minimum
    for (let i = peakIndex + 1; i < amplitudes.length; i++) {
      if (amplitudes[i] < rightMin) {
        rightMin = amplitudes[i];
      }
      if (amplitudes[i] > peakValue) break;
    }

    return peakValue - Math.max(leftMin, rightMin);
  }

  // ========================================================================
  // BAND DETECTION
  // ========================================================================

  /**
   * Detect band from frequency range
   */
  static detectBandFromFrequencyRange(minFreqMHz: number, maxFreqMHz: number): BandType | null {
    const bandEntries = Object.entries(BAND_DEFINITIONS) as [BandType, typeof BAND_DEFINITIONS[BandType]][];
    
    for (const [bandType, definition] of bandEntries) {
      // Check if the frequency range overlaps with the band
      if (!(maxFreqMHz < definition.startMHz || minFreqMHz > definition.endMHz)) {
        return bandType;
      }
    }

    return null;
  }

  /**
   * Detect band from filename
   */
  static detectBandFromFilename(filename: string): BandType | null {
    const upperFilename = filename.toUpperCase();
    
    // Look for band patterns in filename
    const bandPatterns: [BandType, RegExp[]][] = [
      ['B0', [/B0/i, /BAND\s*0/i, /10\s*KHZ/i, /160\s*KHZ/i]],
      ['B1', [/B1/i, /BAND\s*1/i, /150\s*KHZ/i, /650\s*KHZ/i]],
      ['B2', [/B2/i, /BAND\s*2/i, /500\s*KHZ/i, /3\s*MHZ/i]],
      ['B3', [/B3/i, /BAND\s*3/i, /2\.?5\s*MHZ/i, /7\.?5\s*MHZ/i]],
      ['B4', [/B4/i, /BAND\s*4/i, /5\s*MHZ/i, /30\s*MHZ/i]],
      ['B5', [/B5/i, /BAND\s*5/i, /25\s*MHZ/i, /325\s*MHZ/i]],
      ['B6', [/B6/i, /BAND\s*6/i, /300\s*MHZ/i, /1\.?3\s*GHZ/i]],
      ['B7', [/B7/i, /BAND\s*7/i, /1\s*GHZ/i, /6\s*GHZ/i]]
    ];

    for (const [bandType, patterns] of bandPatterns) {
      if (patterns.some(pattern => pattern.test(upperFilename))) {
        return bandType;
      }
    }

    return null;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  /**
   * Check if file is a valid CSV file
   */
  static isValidCsvFile(file: File): boolean {
    return SUPPORTED_CSV_TYPES.includes(file.type) || 
           file.name.toLowerCase().endsWith('.csv') ||
           file.name.toLowerCase().endsWith('.txt');
  }

  /**
   * Read file as text
   */
  static readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse string to number with better error handling
   */
  private static parseNumber(str: string): number {
    if (!str || typeof str !== 'string') return NaN;
    
    // Remove any whitespace and common units
    const cleaned = str.trim()
      .replace(/[^\d\.\-\+eE]/g, '') // Keep only digits, decimal, signs, and scientific notation
      .replace(/^0+/, '0'); // Remove leading zeros but keep at least one
    
    return parseFloat(cleaned);
  }

  /**
   * Generate nice axis ranges for plotting
   */
  static calculateNiceRanges(
    minFreq: number,
    maxFreq: number,
    minAmp: number,
    maxAmp: number
  ): {
    frequency: { min: number; max: number };
    amplitude: { min: number; max: number };
  } {
    // Add 5% padding to frequency range
    const freqPadding = (maxFreq - minFreq) * 0.05;
    const niceMinFreq = Math.max(0, minFreq - freqPadding);
    const niceMaxFreq = maxFreq + freqPadding;

    // Add 10% padding to amplitude range
    const ampPadding = (maxAmp - minAmp) * 0.1;
    const niceMinAmp = minAmp - ampPadding;
    const niceMaxAmp = maxAmp + ampPadding;

    return {
      frequency: { min: niceMinFreq, max: niceMaxFreq },
      amplitude: { min: niceMinAmp, max: niceMaxAmp }
    };
  }

  /**
   * Filter data to a specific band range
   */
  static filterDataToBand(data: CsvDataPoint[], band: BandType): CsvDataPoint[] {
    const definition = BAND_DEFINITIONS[band];
    const startHz = definition.startMHz * 1e6;
    const endHz = definition.endMHz * 1e6;

    return data.filter(point => 
      point.frequency >= startHz && point.frequency <= endHz
    );
  }

  /**
   * Export CSV data to file
   */
  static exportToCSV(
    datasets: CsvOverlayDataset[],
    includeHeader: boolean = true
  ): string {
    if (datasets.length === 0) return '';

    let csvContent = '';

    // Add header if requested
    if (includeHeader) {
      csvContent += '# REDA EMC Testing Tool Export\n';
      csvContent += `# Generated: ${new Date().toISOString()}\n`;
      csvContent += `# Datasets: ${datasets.length}\n`;
      csvContent += '#\n';
    }

    // Add data header
    const headers = ['Frequency (Hz)', 'Amplitude (dBμV/m)', 'Dataset'];
    csvContent += headers.join(',') + '\n';

    // Add data
    for (const dataset of datasets) {
      for (const point of dataset.data) {
        csvContent += `${point.frequency},${point.amplitude},"${dataset.filename}"\n`;
      }
    }

    return csvContent;
  }

  /**
   * Generate filename suggestions based on content
   */
  static generateFilename(
    band?: BandType,
    runId?: string,
    timestamp?: Date
  ): string {
    const parts: string[] = ['reda_export'];
    
    if (band) parts.push(band.toLowerCase());
    if (runId) parts.push(runId);
    
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    parts.push(dateStr);
    
    return parts.join('_') + '.csv';
  }
} 