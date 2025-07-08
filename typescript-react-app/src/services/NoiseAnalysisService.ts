// ========================================================================
// REDA EMC Testing Tool - Noise Analysis Service
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Service for analyzing signal noisiness and calculating noisiness indices
// ========================================================================

import { CsvDataPoint } from '../types';

// ========================================================================
// NOISE ANALYSIS INTERFACES
// ========================================================================

export interface NoisinessMetrics {
  averageAmplitude: number;    // 0-1, higher = higher average amplitude (primary noisiness indicator)
  varianceScore: number;       // 0-1, higher = more variance/noise
  peakToRmsRatio: number;      // Lower values indicate more noise
  spectralFlatness: number;    // 0-1, higher = flatter spectrum (more noise)
  highFreqContent: number;     // 0-1, higher = more high-freq noise
  smallPeakDensity: number;    // 0-1, higher = more noise spikes
  overallNoisiness: number;    // 0-100, final noisiness index
}

export interface NoiseAnalysisResult {
  filename: string;
  noisinessIndex: number;      // 0-100 scale
  metrics: NoisinessMetrics;
  confidence: 'high' | 'medium' | 'low';
  category: 'very_quiet' | 'quiet' | 'moderate' | 'noisy' | 'very_noisy';
}

// ========================================================================
// NOISE ANALYSIS SERVICE
// ========================================================================

export class NoiseAnalysisService {
  
  /**
   * Calculate comprehensive noisiness index for signal data
   */
  static calculateNoisinessIndex(
    data: CsvDataPoint[], 
    filename: string = 'unknown'
  ): NoiseAnalysisResult {
    
    if (!data || data.length < 10) {
      // Calculate average amplitude even with limited data if possible
      const amplitudes = data?.map(point => point.amplitude).filter(amp => isFinite(amp)) || [];
      const averageAmplitude = amplitudes.length > 0 ? this.calculateAverageAmplitudeScore(amplitudes) : 0;
      const fallbackScore = amplitudes.length > 0 ? Math.round(averageAmplitude * 95 + 5) : 50; // 95% average amplitude, 5% base
      
      return {
        filename,
        noisinessIndex: fallbackScore,
        metrics: {
          averageAmplitude,
          varianceScore: 0,
          peakToRmsRatio: 0,
          spectralFlatness: 0,
          highFreqContent: 0,
          smallPeakDensity: 0,
          overallNoisiness: fallbackScore
        },
        confidence: 'low',
        category: 'moderate'
      };
    }

    const amplitudes = data.map(point => point.amplitude).filter(amp => isFinite(amp));
    const frequencies = data.map(point => point.frequency).filter(freq => isFinite(freq));
    
    // Early validation - if we don't have enough valid data, use simplified calculation
    if (amplitudes.length < 10) {
      const averageAmplitude = this.calculateAverageAmplitudeScore(amplitudes);
      const simpleVariance = this.calculateSimpleNoisiness(amplitudes);
      
      // Almost entirely based on average amplitude (95%) with minimal variance (5%)
      const combinedScore = averageAmplitude * 0.95 + (simpleVariance / 100) * 0.05;
      const finalScore = Math.round(combinedScore * 100);
      
      return {
        filename,
        noisinessIndex: finalScore,
        metrics: {
          averageAmplitude,
          varianceScore: simpleVariance / 100,
          peakToRmsRatio: 0.5,
          spectralFlatness: 0.5,
          highFreqContent: 0.5,
          smallPeakDensity: 0.5,
          overallNoisiness: finalScore
        },
        confidence: 'low',
        category: this.categorizeNoisiness(finalScore)
      };
    }
    
    // Calculate enhanced metrics for better discrimination
    const averageAmplitude = this.calculateAverageAmplitudeScore(amplitudes);
    const varianceScore = this.calculateVarianceScore(amplitudes);
    const peakToRmsRatio = this.calculatePeakToRmsRatio(amplitudes);
    const spectralFlatness = this.calculateSpectralFlatness(amplitudes);
    const highFreqContent = this.calculateHighFrequencyContent(data);
    const smallPeakDensity = this.calculateSmallPeakDensity(amplitudes);
    
    // Additional discriminating metrics
    const signalSmoothness = this.calculateSignalSmoothness(amplitudes);
    const dynamicRange = this.calculateDynamicRange(amplitudes);
    
    // Enhanced weighted combination prioritizing average amplitude for noisiness
    const overallNoisiness = this.combineEnhancedMetrics({
      averageAmplitude,
      varianceScore,
      peakToRmsRatio,
      spectralFlatness,
      highFreqContent,
      smallPeakDensity,
      signalSmoothness,
      dynamicRange
    });

    const metrics: NoisinessMetrics = {
      averageAmplitude,
      varianceScore,
      peakToRmsRatio,
      spectralFlatness,
      highFreqContent,
      smallPeakDensity,
      overallNoisiness
    };

    // Ensure the final noisiness index is finite and within bounds
    const finalNoisiness = isFinite(overallNoisiness) ? Math.round(Math.max(0, Math.min(100, overallNoisiness))) : 50;

    return {
      filename,
      noisinessIndex: finalNoisiness,
      metrics,
      confidence: this.assessConfidence(data.length, frequencies),
      category: this.categorizeNoisiness(finalNoisiness)
    };
  }

  /**
   * Calculate average amplitude score (0-1, higher = higher average amplitude = noisier)
   * This is the primary metric for determining noisiness based on average amplitude values
   */
  private static calculateAverageAmplitudeScore(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 0;
    
    // Filter out any non-finite values
    const validAmplitudes = amplitudes.filter(amp => isFinite(amp));
    if (validAmplitudes.length === 0) return 0;
    
    // Calculate simple average amplitude
    const averageAmplitude = validAmplitudes.reduce((sum, val) => sum + val, 0) / validAmplitudes.length;
    
    if (!isFinite(averageAmplitude)) return 0;
    
    // Normalize average amplitude to 0-1 scale
    // EMC data typically ranges from very low (quiet) to high (noisy) amplitudes
    // We use a sigmoid function to map average amplitude to noisiness score
    // Assume amplitudes typically range from -80dB to +20dB, with higher values being noisier
    const minExpectedAmplitude = -80; // dB - very quiet signal
    const maxExpectedAmplitude = 20;  // dB - very noisy signal
    
    // Normalize to 0-1 range
    const normalizedAmplitude = (averageAmplitude - minExpectedAmplitude) / (maxExpectedAmplitude - minExpectedAmplitude);
    
    // Apply sigmoid transformation for smooth transition
    // Values closer to maxExpectedAmplitude will be closer to 1 (noisier)
    const clampedNormalized = Math.max(0, Math.min(1, normalizedAmplitude));
    
    // Use a sigmoid to enhance the separation between different amplitude levels
    const sigmoidInput = (clampedNormalized - 0.5) * 6; // Scale for steeper curve
    const sigmoidOutput = 1 / (1 + Math.exp(-sigmoidInput));
    
    return isFinite(sigmoidOutput) ? sigmoidOutput : 0.5;
  }

  /**
   * Calculate adaptive threshold based on signal characteristics
   */
  private static calculateAdaptiveThreshold(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 10;
    
    const sorted = [...amplitudes].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(amplitudes.length * 0.25)];
    const q3 = sorted[Math.floor(amplitudes.length * 0.75)];
    const iqr = q3 - q1;
    
    // Adaptive threshold based on interquartile range
    // Clean signals typically have small IQR, noisy signals have large IQR
    return Math.max(3, Math.min(25, iqr * 2 + 5));
  }

  /**
   * Enhanced signal smoothness analysis
   */
  private static calculateSignalSmoothness(amplitudes: number[]): number {
    if (amplitudes.length < 3) return 0;
    
    let totalVariation = 0;
    for (let i = 1; i < amplitudes.length - 1; i++) {
      // Second derivative approximation (measure of "jaggedness")
      const secondDerivative = amplitudes[i+1] - 2*amplitudes[i] + amplitudes[i-1];
      totalVariation += Math.abs(secondDerivative);
    }
    
    const avgVariation = totalVariation / (amplitudes.length - 2);
    // Sigmoid transformation for better separation
    return 1 / (1 + Math.exp(-0.5 * (avgVariation - 3)));
  }

  /**
   * Dynamic range analysis
   */
  private static calculateDynamicRange(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 0;
    
    const sorted = [...amplitudes].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min;
    
    // Very clean signals often have consistent levels (low range)
    // Very noisy signals have extreme variations (high range)
    const normalizedRange = Math.min(range / 50, 1); // Assume 50dB max reasonable range
    return normalizedRange;
  }

  /**
   * Simple noisiness calculation for cases with limited data
   * Now almost entirely based on average amplitude (95%)
   */
  private static calculateSimpleNoisiness(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 50;
    
    // Calculate average amplitude score (dominant factor)
    const averageAmplitudeScore = this.calculateAverageAmplitudeScore(amplitudes);
    
    // Simple standard deviation based calculation (minimal factor)
    const mean = amplitudes.reduce((sum, val) => sum + val, 0) / amplitudes.length;
    const variance = amplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amplitudes.length;
    const stdDev = Math.sqrt(variance);
    
    // Enhanced scaling with sigmoid for better separation
    const normalizedStdDev = stdDev / 8; // Adaptive to typical EMC data
    const varianceScore = 100 / (1 + Math.exp(-2 * (normalizedStdDev - 1)));
    const varianceNormalized = Math.max(5, Math.min(95, varianceScore)) / 100;
    
    // Almost entirely based on average amplitude (95%) with minimal variance (5%)
    const combinedScore = averageAmplitudeScore * 0.95 + varianceNormalized * 0.05;
    const finalScore = Math.round(combinedScore * 100);
    
    return Math.max(5, Math.min(95, finalScore));
  }

  /**
   * Calculate variance-based noise score with adaptive scaling
   */
  private static calculateVarianceScore(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 0;
    
    // Filter out any non-finite values
    const validAmplitudes = amplitudes.filter(amp => isFinite(amp));
    if (validAmplitudes.length === 0) return 0;
    
    const mean = validAmplitudes.reduce((sum, val) => sum + val, 0) / validAmplitudes.length;
    const variance = validAmplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validAmplitudes.length;
    const stdDev = Math.sqrt(variance);
    
    // Enhanced adaptive scaling based on signal characteristics
    // Use sigmoid function for better separation
    const adaptiveThreshold = this.calculateAdaptiveThreshold(validAmplitudes);
    const normalizedStdDev = stdDev / adaptiveThreshold;
    
    // Sigmoid transformation for better dynamic range (0-1)
    const score = 1 / (1 + Math.exp(-3 * (normalizedStdDev - 1)));
    return isFinite(score) ? score : 0;
  }

  /**
   * Enhanced peak-to-RMS analysis with crest factor and distribution analysis
   */
  private static calculatePeakToRmsRatio(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 0;
    
    // Filter out any non-finite values
    const validAmplitudes = amplitudes.filter(amp => isFinite(amp));
    if (validAmplitudes.length === 0) return 0;
    
    const peak = Math.max(...validAmplitudes);
    const rms = Math.sqrt(validAmplitudes.reduce((sum, val) => sum + val * val, 0) / validAmplitudes.length);
    
    if (!isFinite(peak) || !isFinite(rms) || rms === 0) return 0;
    
    const crestFactor = peak / rms;
    if (!isFinite(crestFactor)) return 0;
    
    // Enhanced analysis: combine crest factor with distribution characteristics
    const mean = validAmplitudes.reduce((sum, val) => sum + val, 0) / validAmplitudes.length;
    const skewness = this.calculateSkewness(validAmplitudes, mean);
    
    // Clean signals: high crest factor + low skewness
    // Noisy signals: low crest factor + high skewness
    const crestScore = 1 / (1 + Math.exp(-0.5 * (crestFactor - 4))); // Sigmoid around crest factor of 4
    const skewnessScore = Math.abs(skewness) / 3; // Normalize skewness influence
    
    // Combined score (inverted because lower = more noise for final calculation)
    const combinedScore = (crestScore * 0.7 + (1 - skewnessScore) * 0.3);
    return Math.max(0, Math.min(1, combinedScore));
  }

  /**
   * Calculate skewness of amplitude distribution
   */
  private static calculateSkewness(amplitudes: number[], mean: number): number {
    if (amplitudes.length === 0) return 0;
    
    const variance = amplitudes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amplitudes.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev === 0) return 0;
    
    const skewness = amplitudes.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / amplitudes.length;
    return isFinite(skewness) ? skewness : 0;
  }

  /**
   * Calculate spectral flatness (0-1, higher = flatter/noisier)
   */
  private static calculateSpectralFlatness(amplitudes: number[]): number {
    if (amplitudes.length === 0) return 0;
    
    // Convert to linear scale for calculation, ensuring no zero values
    const linearAmplitudes = amplitudes.map(amp => {
      const linear = Math.pow(10, amp / 20);
      return Math.max(linear, 1e-12); // Prevent zero values
    });
    
    // Calculate geometric mean using log-space to avoid overflow/underflow
    const logSum = linearAmplitudes.reduce((sum, val) => {
      const logVal = Math.log(val);
      return sum + (isFinite(logVal) ? logVal : -27.6); // log(1e-12) ≈ -27.6
    }, 0);
    const geometricMean = Math.exp(logSum / linearAmplitudes.length);
    
    // Arithmetic mean
    const arithmeticMean = linearAmplitudes.reduce((sum, val) => sum + val, 0) / linearAmplitudes.length;
    
    // Ensure we don't divide by zero and result is finite
    if (!isFinite(geometricMean) || !isFinite(arithmeticMean) || arithmeticMean === 0) {
      return 0;
    }
    
    const flatness = geometricMean / arithmeticMean;
    return isFinite(flatness) ? Math.min(flatness, 1) : 0;
  }

  /**
   * Calculate high-frequency content ratio
   */
  private static calculateHighFrequencyContent(data: CsvDataPoint[]): number {
    if (data.length < 4) return 0;
    
    // Filter out any points with non-finite values
    const validData = data.filter(point => 
      isFinite(point.frequency) && isFinite(point.amplitude)
    );
    
    if (validData.length < 4) return 0;
    
    const sortedByFreq = [...validData].sort((a, b) => a.frequency - b.frequency);
    const totalRange = sortedByFreq[sortedByFreq.length - 1].frequency - sortedByFreq[0].frequency;
    
    if (totalRange === 0 || !isFinite(totalRange)) return 0;
    
    // Define "high frequency" as top 25% of the frequency range
    const highFreqThreshold = sortedByFreq[0].frequency + totalRange * 0.75;
    
    const highFreqPoints = validData.filter(point => point.frequency >= highFreqThreshold);
    const lowFreqPoints = validData.filter(point => point.frequency < highFreqThreshold);
    
    if (lowFreqPoints.length === 0 || highFreqPoints.length === 0) return 0;
    
    const highFreqMean = highFreqPoints.reduce((sum, p) => sum + p.amplitude, 0) / highFreqPoints.length;
    const lowFreqMean = lowFreqPoints.reduce((sum, p) => sum + p.amplitude, 0) / lowFreqPoints.length;
    
    if (!isFinite(highFreqMean) || !isFinite(lowFreqMean) || lowFreqMean === 0) return 0;
    
    // High frequency content relative to low frequency content
    const ratio = highFreqMean / lowFreqMean;
    
    if (!isFinite(ratio)) return 0;
    
    // Normalize to 0-1 scale - higher ratio suggests more high-freq noise
    const score = Math.min(Math.max(0, (ratio - 0.5) / 1.5), 1);
    return isFinite(score) ? score : 0;
  }

  /**
   * Calculate density of small peaks (noise spikes)
   */
  private static calculateSmallPeakDensity(amplitudes: number[]): number {
    if (amplitudes.length < 5) return 0;
    
    // Filter out any non-finite values
    const validAmplitudes = amplitudes.filter(amp => isFinite(amp));
    if (validAmplitudes.length < 5) return 0;
    
    let peakCount = 0;
    const threshold = 2; // dB threshold for considering a peak
    
    for (let i = 2; i < validAmplitudes.length - 2; i++) {
      const current = validAmplitudes[i];
      const leftAvg = (validAmplitudes[i-1] + validAmplitudes[i-2]) / 2;
      const rightAvg = (validAmplitudes[i+1] + validAmplitudes[i+2]) / 2;
      
      // Ensure all values are finite
      if (!isFinite(current) || !isFinite(leftAvg) || !isFinite(rightAvg)) continue;
      
      // Check if current point is a local peak above threshold
      if (current > leftAvg + threshold && current > rightAvg + threshold) {
        peakCount++;
      }
    }
    
    // Density of peaks per 100 data points
    const density = (peakCount / validAmplitudes.length) * 100;
    
    if (!isFinite(density)) return 0;
    
    // Normalize to 0-1 scale - more peaks suggest more noise
    const score = Math.min(density / 10, 1); // Assume 10 peaks per 100 points = very noisy
    return isFinite(score) ? score : 0;
  }

  /**
   * Enhanced metric combination with better discrimination
   */
  private static combineEnhancedMetrics(metrics: {
    averageAmplitude: number;
    varianceScore: number;
    peakToRmsRatio: number;
    spectralFlatness: number;
    highFreqContent: number;
    smallPeakDensity: number;
    signalSmoothness: number;
    dynamicRange: number;
  }): number {
    // Simplified weighting - average amplitude is now the dominant factor
    const weights = {
      averageAmplitude: 0.95,      // 95% - average amplitude (DOMINANT factor)
      varianceScore: 0.02,         // 2% - minimal variance influence
      peakToRmsRatio: 0.01,        // 1% - minimal peak ratio influence
      spectralFlatness: 0.01,      // 1% - minimal spectral influence
      highFreqContent: 0.005,      // 0.5% - minimal high-freq influence
      smallPeakDensity: 0.005,     // 0.5% - minimal peak density influence
      signalSmoothness: 0.0,       // 0% - disabled
      dynamicRange: 0.0            // 0% - disabled
    };
    
    // Ensure all metric values are finite before combining
    const safeAverageAmplitude = isFinite(metrics.averageAmplitude) ? metrics.averageAmplitude : 0.5;
    const safeVariance = isFinite(metrics.varianceScore) ? metrics.varianceScore : 0.5;
    const safePeakRms = isFinite(metrics.peakToRmsRatio) ? metrics.peakToRmsRatio : 0.5;
    const safeFlatness = isFinite(metrics.spectralFlatness) ? metrics.spectralFlatness : 0.5;
    const safeHighFreq = isFinite(metrics.highFreqContent) ? metrics.highFreqContent : 0.5;
    const safePeakDensity = isFinite(metrics.smallPeakDensity) ? metrics.smallPeakDensity : 0.5;
    const safeSmoothness = isFinite(metrics.signalSmoothness) ? metrics.signalSmoothness : 0.5;
    const safeDynamicRange = isFinite(metrics.dynamicRange) ? metrics.dynamicRange : 0.5;
    
    const weightedSum = 
      safeAverageAmplitude * weights.averageAmplitude +
      safeVariance * weights.varianceScore +
      safePeakRms * weights.peakToRmsRatio +
      safeFlatness * weights.spectralFlatness +
      safeHighFreq * weights.highFreqContent +
      safePeakDensity * weights.smallPeakDensity +
      safeSmoothness * weights.signalSmoothness +
      safeDynamicRange * weights.dynamicRange;
    
    // Apply final sigmoid transformation for enhanced separation
    // This spreads out the middle values more effectively
    const sigmoidInput = (weightedSum - 0.5) * 4; // Scale and center around 0
    const sigmoidOutput = 1 / (1 + Math.exp(-sigmoidInput));
    
    // Convert to 0-100 scale with enhanced dynamic range
    const result = sigmoidOutput * 100;
    return isFinite(result) ? Math.max(1, Math.min(99, result)) : 50;
  }

  /**
   * Assess confidence in the noisiness calculation
   */
  private static assessConfidence(
    dataLength: number, 
    frequencies: number[]
  ): 'high' | 'medium' | 'low' {
    const freqRange = Math.max(...frequencies) - Math.min(...frequencies);
    
    if (dataLength >= 1000 && freqRange > 0) return 'high';
    if (dataLength >= 100 && freqRange > 0) return 'medium';
    return 'low';
  }

  /**
   * Categorize noisiness level for 1-10 scale
   */
  private static categorizeNoisiness(noisiness: number): NoiseAnalysisResult['category'] {
    if (noisiness <= 2) return 'very_quiet';
    if (noisiness <= 4) return 'quiet';
    if (noisiness <= 6) return 'moderate';
    if (noisiness <= 8) return 'noisy';
    return 'very_noisy';
  }

  /**
   * Get color for noisiness visualization (1-10 scale)
   */
  static getNoisinessColor(noisiness: number): string {
    if (noisiness <= 2) return '#2ecc71'; // Green - very quiet
    if (noisiness <= 4) return '#27ae60'; // Dark green - quiet  
    if (noisiness <= 6) return '#f39c12'; // Orange - moderate
    if (noisiness <= 8) return '#e67e22'; // Dark orange - noisy
    return '#e74c3c'; // Red - very noisy
  }

  /**
   * Get text description for noisiness level (1-10 scale)
   */
  static getNoisinessDescription(noisiness: number): string {
    if (noisiness <= 2) return 'Very Quiet';
    if (noisiness <= 4) return 'Quiet';
    if (noisiness <= 6) return 'Moderate';
    if (noisiness <= 8) return 'Noisy';
    return 'Very Noisy';
  }

  /**
   * Batch analyze multiple files and rank by noisiness
   */
  static async batchAnalyzeAndRank(
    files: Array<{ filename: string; data: CsvDataPoint[] }>
  ): Promise<NoiseAnalysisResult[]> {
    const results = files.map(file => 
      this.calculateNoisinessIndex(file.data, file.filename)
    );
    
    // Sort by noisiness (highest first)
    return results.sort((a, b) => b.noisinessIndex - a.noisinessIndex);
  }

  /**
   * Calculate band-relative noisiness index for multiple files in the same band
   * This method compares files within their band and scales from 0-100
   * @param filesData Array of files with their data and band information
   * @returns Array of results with relative noisiness (0-100 within band)
   */
  static calculateBandRelativeNoisiness(
    filesData: Array<{ filename: string; data: CsvDataPoint[]; band?: string }>
  ): NoiseAnalysisResult[] {
    if (filesData.length === 0) return [];
    
    // Group files by band
    const filesByBand = filesData.reduce((groups, file) => {
      const band = file.band || 'Unknown';
      if (!groups[band]) groups[band] = [];
      groups[band].push(file);
      return groups;
    }, {} as Record<string, typeof filesData>);
    
    const allResults: NoiseAnalysisResult[] = [];
    
    // Process each band separately
    for (const [band, bandFiles] of Object.entries(filesByBand)) {
      console.log(`🎯 Processing ${bandFiles.length} files in band ${band}`);
      
      // Calculate average amplitude for each file in this band
      const fileAmplitudes = bandFiles.map(file => {
        const amplitudes = file.data.map(point => point.amplitude).filter(amp => isFinite(amp));
        const avgAmplitude = amplitudes.length > 0 
          ? amplitudes.reduce((sum, val) => sum + val, 0) / amplitudes.length
          : -999;
        return { file, avgAmplitude, amplitudes };
      }).filter(item => item.avgAmplitude !== -999);
      
      if (fileAmplitudes.length === 0) continue;
      
      // Find min and max average amplitudes in this band
      const avgAmps = fileAmplitudes.map(item => item.avgAmplitude);
      const minAvgAmp = Math.min(...avgAmps);
      const maxAvgAmp = Math.max(...avgAmps);
      const ampRange = maxAvgAmp - minAvgAmp;
      
      console.log(`📊 Band ${band} amplitude range: ${minAvgAmp.toFixed(1)} to ${maxAvgAmp.toFixed(1)} dB (range: ${ampRange.toFixed(1)} dB)`);
      
      // Calculate relative noisiness for each file in this band
      for (const { file, avgAmplitude, amplitudes } of fileAmplitudes) {
        // Calculate relative position within band (0-1)
        let relativePosition = 0;
        if (ampRange > 0.1) { // Avoid division by very small numbers
          relativePosition = (avgAmplitude - minAvgAmp) / ampRange;
        } else {
          // If all files have very similar amplitudes, give them middle scores
          relativePosition = 0.5;
        }
        
        // Scale to 1-10 range with clear distinctions
        // Quietest file gets 1, noisiest gets 10
        const bandRelativeNoisiness = Math.round(relativePosition * 9 + 1);
        
        // Calculate other metrics for completeness (but don't use them much)
        const varianceScore = this.calculateVarianceScore(amplitudes);
        const peakToRmsRatio = this.calculatePeakToRmsRatio(amplitudes);
        const spectralFlatness = this.calculateSpectralFlatness(amplitudes);
        const highFreqContent = this.calculateHighFrequencyContent(file.data);
        const smallPeakDensity = this.calculateSmallPeakDensity(amplitudes);
        
        const result: NoiseAnalysisResult = {
          filename: file.filename,
          noisinessIndex: bandRelativeNoisiness,
          metrics: {
            averageAmplitude: relativePosition, // Store relative position
            varianceScore,
            peakToRmsRatio,
            spectralFlatness,
            highFreqContent,
            smallPeakDensity,
            overallNoisiness: bandRelativeNoisiness
          },
          confidence: amplitudes.length >= 100 ? 'high' : amplitudes.length >= 50 ? 'medium' : 'low',
          category: this.categorizeNoisiness(bandRelativeNoisiness)
        };
        
        allResults.push(result);
        console.log(`📈 ${file.filename}: Avg=${avgAmplitude.toFixed(1)}dB, Relative=${relativePosition.toFixed(2)}, Noisiness=${bandRelativeNoisiness}/10`);
      }
    }
    
    console.log(`✅ Band-relative noisiness analysis complete for ${filesData.length} files`);
    console.log(`📊 Results: Files now ranked 1-10 within their respective bands (1=quietest, 10=noisiest)`);
    
    return allResults;
  }
} 