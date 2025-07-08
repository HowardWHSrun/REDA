// ========================================================================
// REDA EMC Testing Tool - CSV Visualization Component (Enhanced)
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Professional Chart.js visualization with matplotlib-quality styling
// ========================================================================

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { useCsvOverlayState } from '../../context/AppContext';
import { CsvService } from '../../services/CsvService';
import { CsvOverlayDataset, DetectedPeak, BandType } from '../../types';
import { BAND_DEFINITIONS } from '../../constants';
import './CsvVisualization.css';

// Register Chart.js components
ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

// ========================================================================
// COMPONENT INTERFACES
// ========================================================================

interface CsvVisualizationProps {
  width?: number;
  height?: number;
  showControls?: boolean;
  showLegend?: boolean;
  onPeakClick?: (peak: DetectedPeak, dataset: CsvOverlayDataset) => void;
}

interface VisualizationState {
  selectedBand: BandType | 'all';
  showPeaks: boolean;
  detectedPeaks: Array<{ dataset: CsvOverlayDataset; peaks: DetectedPeak[] }>;
  isAnalyzing: boolean;
  zoomLevel: number;
  isExporting: boolean;
  isEditingTitle: boolean;
  isEditingLegend: boolean;
  customTitle: string;
  customLegendLabels: { [key: string]: string };
}

// ========================================================================
// PROFESSIONAL CHART STYLING (MATPLOTLIB-INSPIRED)
// ========================================================================

const CHART_COLORS = {
  primary: '#1f77b4',    // Matplotlib default blue
  orange: '#ff7f0e',     // Matplotlib orange
  green: '#2ca02c',      // Matplotlib green
  red: '#d62728',        // Matplotlib red
  purple: '#9467bd',     // Matplotlib purple
  brown: '#8c564b',      // Matplotlib brown
  pink: '#e377c2',       // Matplotlib pink
  gray: '#7f7f7f',       // Matplotlib gray
  olive: '#bcbd22',      // Matplotlib olive
  cyan: '#17becf'        // Matplotlib cyan
};

const PROFESSIONAL_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.orange,
  CHART_COLORS.green,
  CHART_COLORS.red,
  CHART_COLORS.purple,
  CHART_COLORS.brown,
  CHART_COLORS.pink,
  CHART_COLORS.gray
];

// ========================================================================
// CSV VISUALIZATION COMPONENT
// ========================================================================

export const CsvVisualization: React.FC<CsvVisualizationProps> = ({
  width = 1200,
  height = 600, // Exactly 1/2 of width for 2:1 ratio
  showControls = true,
  showLegend = true,
  onPeakClick
}) => {
  const { csvOverlayState } = useCsvOverlayState();
  const chartRef = useRef<ChartJS<'line'>>(null);

  const [vizState, setVizState] = useState<VisualizationState>({
    selectedBand: 'all',
    showPeaks: false,
    detectedPeaks: [],
    isAnalyzing: false,
    zoomLevel: 1,
    isExporting: false,
    isEditingTitle: false,
    isEditingLegend: false,
    customTitle: '',
    customLegendLabels: {}
  });

  // ========================================================================
  // DATA PROCESSING
  // ========================================================================

  // Reset chart zoom when datasets change to prevent cropping issues
  React.useEffect(() => {
    if (chartRef.current) {
              // Small delay to ensure chart has rendered with new/cleared data
      setTimeout(() => {
        if (chartRef.current) {
          chartRef.current.resetZoom();
          console.log('🔄 Chart zoom reset for dataset change');
        }
      }, 100);
    }
  }, [csvOverlayState.datasets.length, csvOverlayState.datasets]);

  const processedDatasets = useMemo(() => {
    if (!csvOverlayState.datasets || csvOverlayState.datasets.length === 0) {
      return [];
    }

    return csvOverlayState.datasets
      .filter(dataset => dataset.visible)
      .map((dataset, index) => {
        let processedData = dataset.data;

        // Auto-detect band from frequency range for labeling purposes only
        const frequencies = dataset.data.map(point => point.frequency / 1e6); // Convert to MHz
        const minFreq = Math.min(...frequencies);
        const maxFreq = Math.max(...frequencies);
        const detectedBand = CsvService.detectBandFromFrequencyRange(minFreq, maxFreq);
        
        // Only filter if user explicitly selects a band filter (not automatic)
        if (vizState.selectedBand !== 'all') {
          // Filter to user-selected band only when explicitly requested
          const bandDefinition = BAND_DEFINITIONS[vizState.selectedBand];
          const startHz = bandDefinition.startMHz * 1e6;
          const endHz = bandDefinition.endMHz * 1e6;
          
          processedData = dataset.data.filter(point => 
            point.frequency >= startHz && point.frequency <= endHz
          );
          
          console.log(`🎯 User-filtered ${dataset.filename} to band ${vizState.selectedBand} (${bandDefinition.range}): ${processedData.length} points`);
        } else {
          // Show ALL data when no explicit filter is applied
          processedData = dataset.data;
          console.log(`📊 Showing full dataset for ${dataset.filename}: ${processedData.length} points (detected band: ${detectedBand || 'Unknown'})`);
        }

        // Use the color assigned during file loading (preserves panel colors)
        const color = dataset.color || PROFESSIONAL_COLORS[index % PROFESSIONAL_COLORS.length];

        return {
          ...dataset,
          data: processedData,
          color: color,
          frequencyData: processedData.map(point => point.frequency / 1e6), // Convert to MHz
          amplitudeData: processedData.map(point => point.amplitude),
          detectedBand: detectedBand
        };
      });
  }, [csvOverlayState.datasets, vizState.selectedBand]);

  // ========================================================================
  // PROFESSIONAL CHART CONFIGURATION
  // ========================================================================

  // Calculate optimal x-axis ticks with dynamic units based on frequency range
  const calculateOptimalTicks = useMemo(() => {
    if (processedDatasets.length === 0) return { min: 0, max: 1, step: 0.1, ticks: [], unit: 'MHz', unitMultiplier: 1 };

    // Use actual data range for x-axis instead of forcing band boundaries
    const allFrequencies = processedDatasets.flatMap(dataset => dataset.frequencyData);
    if (allFrequencies.length === 0) return { min: 0, max: 1, step: 0.1, ticks: [], unit: 'MHz', unitMultiplier: 1 };
    
    let minFreq = Math.min(...allFrequencies);
    let maxFreq = Math.max(...allFrequencies);
    
    // Only use band boundaries if user has explicitly filtered to a single band
    if (vizState.selectedBand !== 'all') {
      const bandDef = BAND_DEFINITIONS[vizState.selectedBand];
      minFreq = bandDef.startMHz;
      maxFreq = bandDef.endMHz;
      console.log(`🎯 Using band ${vizState.selectedBand} boundaries for x-axis: ${minFreq}-${maxFreq} MHz`);
    } else {
      console.log(`📊 Using full data range for x-axis: ${minFreq.toFixed(3)}-${maxFreq.toFixed(3)} MHz`);
    }

    // Determine the best unit based on frequency range
    let unit, unitMultiplier, displayMin, displayMax;
    
    if (maxFreq < 1) {
      // Use kHz for frequencies below 1 MHz
      unit = 'kHz';
      unitMultiplier = 1000; // Convert MHz to kHz
      displayMin = minFreq * unitMultiplier;
      displayMax = maxFreq * unitMultiplier;
    } else if (maxFreq < 1000) {
      // Use MHz for frequencies below 1000 MHz
      unit = 'MHz';
      unitMultiplier = 1; // Already in MHz
      displayMin = minFreq * unitMultiplier;
      displayMax = maxFreq * unitMultiplier;
    } else {
      // Use GHz for frequencies 1000 MHz and above
      unit = 'GHz';
      unitMultiplier = 0.001; // Convert MHz to GHz
      displayMin = minFreq * unitMultiplier;
      displayMax = maxFreq * unitMultiplier;
    }

    const range = displayMax - displayMin;

    // Calculate nice step size for exactly 10 divisions
    const roughStep = range / 10;
    
    // Round to nice numbers (prefer 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, etc.)
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;
    
    let niceStep;
    if (normalized <= 1) niceStep = magnitude;
    else if (normalized <= 2) niceStep = 2 * magnitude;
    else if (normalized <= 5) niceStep = 5 * magnitude;
    else niceStep = 10 * magnitude;

    // Use appropriate boundaries based on whether we're showing band-filtered or full data
    let niceMin, niceMax;
    if (vizState.selectedBand !== 'all') {
      // For band-filtered data, use exact band boundaries
      niceMin = displayMin;
      niceMax = displayMax;
    } else {
      // For full data, use nice rounded boundaries
      niceMin = Math.floor(displayMin / niceStep) * niceStep;
      niceMax = Math.ceil(displayMax / niceStep) * niceStep;
    }
    
    // Generate exactly 11 ticks (10 divisions) within the range
    const ticks = [];
    for (let i = 0; i <= 10; i++) {
      ticks.push(niceMin + i * ((niceMax - niceMin) / 10));
    }

    console.log(`📏 Using ${unit} units for frequency range ${niceMin.toFixed(3)}-${niceMax.toFixed(3)} ${unit}`);

    return {
      min: niceMin,
      max: niceMax,
      step: (niceMax - niceMin) / 10,
      ticks: ticks,
      unit: unit,
      unitMultiplier: unitMultiplier,
      isBandConstrained: vizState.selectedBand !== 'all',
      bandName: vizState.selectedBand !== 'all' ? vizState.selectedBand : null
    };
  }, [processedDatasets, vizState.selectedBand]);

  const chartData: ChartData<'line'> = useMemo(() => {
    console.log(`📊 Processing ${processedDatasets.length} datasets for visualization:`, 
      processedDatasets.map(d => `${d.filename} (${d.panelId}) - ${d.data.length} points`));
    
    const optimalTicks = calculateOptimalTicks;
    
    const datasets = processedDatasets.map((dataset, index) => ({
      label: vizState.customLegendLabels[dataset.id] || dataset.label,
      data: dataset.frequencyData.map((freq, dataIndex) => ({
        x: freq * optimalTicks.unitMultiplier, // Convert to display units
        y: dataset.amplitudeData[dataIndex]
      })),
      borderColor: dataset.color,
      backgroundColor: `${dataset.color}15`, // 15% opacity
      borderWidth: 1.5, // Thinner lines as requested
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: '#ffffff',
      fill: false,
      tension: 0.1,
      spanGaps: false
    }));

    // NYCT limit lines removed per user request

    return { datasets };
  }, [processedDatasets, calculateOptimalTicks, vizState.customLegendLabels]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    const optimalTicks = calculateOptimalTicks;
    
    // Calculate optimal Y-axis ticks with 10-unit increments
    const calculateOptimalYTicks = () => {
      if (processedDatasets.length === 0) return { min: 0, max: 100, step: 10 };
      
      const allAmplitudes = processedDatasets.flatMap(dataset => dataset.amplitudeData);
      if (allAmplitudes.length === 0) return { min: 0, max: 100, step: 10 };
      
      const minAmp = Math.min(...allAmplitudes);
      const maxAmp = Math.max(...allAmplitudes);
      
      // Round to nearest 10s with some padding
      const yMin = Math.floor((minAmp - 5) / 10) * 10;
      const yMax = Math.ceil((maxAmp + 5) / 10) * 10;
      
      // Ensure we have at least a 30dB range for better visibility
      const range = yMax - yMin;
      const minRange = 30;
      if (range < minRange) {
        const midPoint = (yMin + yMax) / 2;
        const expandedMin = Math.floor((midPoint - minRange/2) / 10) * 10;
        const expandedMax = Math.ceil((midPoint + minRange/2) / 10) * 10;
        return { min: expandedMin, max: expandedMax, step: 10 };
      }
      
      return { min: yMin, max: yMax, step: 10 };
    };
    
    const yAxisTicks = calculateOptimalYTicks();
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: 2, // High DPI rendering
      plugins: {
        title: {
          display: vizState.customTitle && vizState.customTitle.trim() ? true : false,
          text: vizState.customTitle || (() => {
            const leftPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-a');
            const rightPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-b');
            
            if (leftPanelDatasets.length > 0 && rightPanelDatasets.length > 0) {
              const leftTitle = leftPanelDatasets[0].filename.replace('.csv', '');
              const rightTitle = rightPanelDatasets[0].filename.replace('.csv', '');
              return `${leftTitle} vs. ${rightTitle}`;
            } else if (leftPanelDatasets.length > 0) {
              return leftPanelDatasets[0].filename.replace('.csv', '');
            } else if (rightPanelDatasets.length > 0) {
              return rightPanelDatasets[0].filename.replace('.csv', '');
            }
            return '';
          })(),
          font: {
            size: 18,
            weight: 'bold',
            family: 'Arial, sans-serif'
          },
          padding: 20,
          color: '#2c3e50'
        },
        legend: {
          display: showLegend,
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'line',
            font: {
              size: 12,
              family: 'Arial, sans-serif'
            },
            padding: 15
          }
        },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#ffffff',
          borderWidth: 1,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            title: (context) => {
              const freq = context[0].parsed.x;
              let formattedFreq;
              if (optimalTicks.unit === 'kHz') {
                formattedFreq = freq >= 100 ? freq.toFixed(0) : freq.toFixed(1);
              } else if (optimalTicks.unit === 'MHz') {
                formattedFreq = freq >= 100 ? freq.toFixed(0) : freq.toFixed(1);
              } else { // GHz
                formattedFreq = freq.toFixed(2);
              }
              return `Frequency: ${formattedFreq} ${optimalTicks.unit}`;
            },
            label: (context) => {
              return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} dBμV/m`;
            }
          }
        },
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
              modifierKey: 'ctrl'
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
            onZoom: ({ chart }) => {
              const zoomLevel = chart.getZoomLevel();
              setVizState(prev => ({ ...prev, zoomLevel }));
            }
          },
          pan: {
            enabled: true,
            mode: 'xy'
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: {
            display: true,
            text: `Frequency (${optimalTicks.unit})`,
            font: {
              size: 14,
              weight: 'bold',
              family: 'Arial, sans-serif'
            },
            color: '#2c3e50'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          min: optimalTicks.min,
          max: optimalTicks.max,
          ticks: {
            font: {
              size: 11,
              family: 'Arial, sans-serif'
            },
            color: '#2c3e50',
            count: 11, // Force exactly 11 ticks = 10 divisions
            min: optimalTicks.min,
            max: optimalTicks.max,
            stepSize: optimalTicks.step,
            callback: function(value: any) {
              const numValue = Number(value);
              // Format numbers based on the unit being used
              if (optimalTicks.unit === 'kHz') {
                if (numValue >= 1000) {
                  return (numValue / 1000).toFixed(1) + 'k';
                } else if (numValue >= 100) {
                  return numValue.toFixed(0);
                } else if (numValue >= 10) {
                  return numValue.toFixed(1);
                } else {
                  return numValue.toFixed(2);
                }
              } else if (optimalTicks.unit === 'MHz') {
                if (numValue >= 1000) {
                  return (numValue / 1000).toFixed(1) + 'k';
                } else if (numValue >= 100) {
                  return numValue.toFixed(0);
                } else if (numValue >= 1) {
                  return numValue.toFixed(1);
                } else {
                  return numValue.toFixed(2);
                }
              } else { // GHz
                if (numValue >= 1) {
                  return numValue.toFixed(1);
                } else {
                  return numValue.toFixed(2);
                }
              }
            }
          }
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Amplitude (dBμV/m)',
            font: {
              size: 14,
              weight: 'bold',
              family: 'Arial, sans-serif'
            },
            color: '#2c3e50'
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
            lineWidth: 1
          },
          min: yAxisTicks.min,
          max: yAxisTicks.max,
          ticks: {
            font: {
              size: 11,
              family: 'Arial, sans-serif'
            },
            color: '#2c3e50',
            stepSize: yAxisTicks.step, // Always 10 dB increments
            callback: function(value: any) {
              return Number(value).toFixed(0) + ' dB';
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      },
      onClick: (event, elements) => {
        if (elements.length > 0 && onPeakClick) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const dataIndex = element.index;
          
          if (datasetIndex < processedDatasets.length) {
            const dataset = processedDatasets[datasetIndex];
            const frequency = dataset.frequencyData[dataIndex];
            const amplitude = dataset.amplitudeData[dataIndex];
            
            // Find if this point is a detected peak
            const peakData = vizState.detectedPeaks.find(p => p.dataset.id === dataset.id);
            const peak = peakData?.peaks.find(p => 
              Math.abs(p.frequency - frequency) < 0.001 && 
              Math.abs(p.amplitude - amplitude) < 0.1
            );
            
            if (peak) {
              onPeakClick(peak, dataset);
            }
          }
        }
      }
    };
  }, [showLegend, processedDatasets, vizState.detectedPeaks, onPeakClick, calculateOptimalTicks, vizState.customTitle]);

  // ========================================================================
  // EXPORT FUNCTIONALITY
  // ========================================================================

  const exportChart = useCallback(async (exportType: 'original' | 'zoom' = 'zoom', format: 'png' | 'pdf' = 'png') => {
    if (!chartRef.current) return;

    setVizState(prev => ({ ...prev, isExporting: true }));

    try {
      // Handle original view export by temporarily resetting zoom
      if (exportType === 'original') {
        chartRef.current.resetZoom();
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for reset
      }

      // Calculate optimal Y-axis ticks with 10-unit increments for export
      const calculateOptimalYTicksForExport = () => {
        if (processedDatasets.length === 0) return { min: 0, max: 100, step: 10 };
        
        const allAmplitudes = processedDatasets.flatMap(dataset => dataset.amplitudeData);
        if (allAmplitudes.length === 0) return { min: 0, max: 100, step: 10 };
        
        const minAmp = Math.min(...allAmplitudes);
        const maxAmp = Math.max(...allAmplitudes);
        
        // Round to nearest 10s with some padding for better visualization
        const yMin = Math.floor((minAmp - 5) / 10) * 10;
        const yMax = Math.ceil((maxAmp + 5) / 10) * 10;
        
        // Ensure we have at least a 30dB range for better visibility
        const range = yMax - yMin;
        const minRange = 30;
        if (range < minRange) {
          const midPoint = (yMin + yMax) / 2;
          const expandedMin = Math.floor((midPoint - minRange/2) / 10) * 10;
          const expandedMax = Math.ceil((midPoint + minRange/2) / 10) * 10;
          return { min: expandedMin, max: expandedMax, step: 10 };
        }
        
        return { min: yMin, max: yMax, step: 10 };
      };

      const exportYAxisTicks = calculateOptimalYTicksForExport();

      // Create export-specific chart with thinner lines
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d');
      
      if (!exportCtx) throw new Error('Could not create export canvas');

      // Set high resolution (300 DPI equivalent)
      const scale = 4; // Increased scale for better quality
      const originalCanvas = chartRef.current.canvas;
      exportCanvas.width = originalCanvas.width * scale;
      exportCanvas.height = originalCanvas.height * scale;
      
      // Set white background
      exportCtx.fillStyle = '#ffffff';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Create export chart with thinner lines
      const exportChartCanvas = document.createElement('canvas');
      const exportChartCtx = exportChartCanvas.getContext('2d');
      exportChartCanvas.width = originalCanvas.width;
      exportChartCanvas.height = originalCanvas.height;
      
      if (!exportChartCtx) throw new Error('Could not create export chart canvas');

      // Create a new chart instance for export with thinner lines
      const optimalTicks = calculateOptimalTicks;
      
      const exportChartData = {
        datasets: processedDatasets.map((dataset, index) => ({
          label: vizState.customLegendLabels[dataset.id] || dataset.label,
          data: dataset.frequencyData.map((freq, dataIndex) => ({
            x: freq * optimalTicks.unitMultiplier, // Convert to display units
            y: dataset.amplitudeData[dataIndex]
          })),
          borderColor: dataset.color,
          backgroundColor: `${dataset.color}15`, // 15% opacity
          borderWidth: 1, // Thinner lines to match display
          pointRadius: 0,
          pointHoverRadius: 0,
          pointHoverBorderWidth: 0,
          fill: false,
          tension: 0.1,
          spanGaps: false
        }))
      };

      // Create temporary chart for export
      const tempChart = new ChartJS(exportChartCanvas, {
        type: 'line',
        data: exportChartData,
        options: {
          responsive: false,
          maintainAspectRatio: false,
          devicePixelRatio: 1,
          animation: false,
          plugins: {
            title: {
              display: vizState.customTitle && vizState.customTitle.trim() ? true : false,
              text: vizState.customTitle || (() => {
                const leftPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-a');
                const rightPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-b');
                
                if (leftPanelDatasets.length > 0 && rightPanelDatasets.length > 0) {
                  const leftTitle = leftPanelDatasets[0].filename.replace('.csv', '');
                  const rightTitle = rightPanelDatasets[0].filename.replace('.csv', '');
                  return `${leftTitle} vs. ${rightTitle}`;
                } else if (leftPanelDatasets.length > 0) {
                  return leftPanelDatasets[0].filename.replace('.csv', '');
                } else if (rightPanelDatasets.length > 0) {
                  return rightPanelDatasets[0].filename.replace('.csv', '');
                }
                return '';
              })(),
              font: {
                size: 36,
                weight: 'bold',
                family: 'Arial, sans-serif'
              },
              padding: 40,
              color: '#2c3e50'
            },
            legend: {
              display: showLegend,
              position: 'bottom' as const,
              labels: {
                usePointStyle: true,
                pointStyle: 'line',
                font: {
                  size: 24,
                  family: 'Arial, sans-serif'
                },
                padding: 30
              }
            },
            tooltip: {
              enabled: false
            }
          },
          scales: {
            x: {
              type: 'linear',
              title: {
                display: true,
                text: `Frequency (${optimalTicks.unit})`,
                font: {
                  size: 28,
                  weight: 'bold',
                  family: 'Arial, sans-serif'
                },
                color: '#2c3e50'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
              },
              min: optimalTicks.min,
              max: optimalTicks.max,
              ticks: {
                font: {
                  size: 22,
                  family: 'Arial, sans-serif'
                },
                color: '#2c3e50',
                count: 11,
                callback: function(value: any) {
                  const numValue = Number(value);
                  if (optimalTicks.unit === 'kHz') {
                    if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'k';
                    else if (numValue >= 100) return numValue.toFixed(0);
                    else if (numValue >= 10) return numValue.toFixed(1);
                    else return numValue.toFixed(2);
                  } else if (optimalTicks.unit === 'MHz') {
                    if (numValue >= 1000) return (numValue / 1000).toFixed(1) + 'k';
                    else if (numValue >= 100) return numValue.toFixed(0);
                    else if (numValue >= 1) return numValue.toFixed(1);
                    else return numValue.toFixed(2);
                  } else {
                    if (numValue >= 1) return numValue.toFixed(1);
                    else return numValue.toFixed(2);
                  }
                }
              }
            },
            y: {
              position: 'left',
              title: {
                display: true,
                text: 'Amplitude (dBμV/m)',
                font: {
                  size: 28,
                  weight: 'bold',
                  family: 'Arial, sans-serif'
                },
                color: '#2c3e50'
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
                lineWidth: 1
              },
              min: exportYAxisTicks.min,
              max: exportYAxisTicks.max,
              ticks: {
                font: {
                  size: 22,
                  family: 'Arial, sans-serif'
                },
                color: '#2c3e50',
                stepSize: exportYAxisTicks.step, // Always 10 dB increments
                callback: function(value: any) {
                  return Number(value).toFixed(0) + ' dB';
                }
              } as any
            }
          },
          interaction: {
            intersect: false,
            mode: 'nearest'
          }
        } as any
      });

      // Copy current zoom state if needed
      if (exportType === 'zoom' && chartRef.current) {
        const currentOptions = chartRef.current.options;
        if (currentOptions?.scales?.x && currentOptions?.scales?.y) {
          tempChart.options.scales!.x!.min = currentOptions.scales.x.min;
          tempChart.options.scales!.x!.max = currentOptions.scales.x.max;
          // For zoom exports, also use the current y-axis range instead of the calculated optimal range
          tempChart.options.scales!.y!.min = currentOptions.scales.y.min;
          tempChart.options.scales!.y!.max = currentOptions.scales.y.max;
          // Recalculate stepSize for zoom export to ensure 10 increments
          const zoomYRange = (currentOptions.scales.y.max as number) - (currentOptions.scales.y.min as number);
          (tempChart.options.scales!.y!.ticks as any).stepSize = zoomYRange / 10;
        }
      }

      // Render the export chart
      tempChart.update('none');
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for render

      // Enable high-quality rendering
      exportCtx.imageSmoothingEnabled = true;
      exportCtx.imageSmoothingQuality = 'high';
      
      // Scale and draw the clean chart (no annotations)
      exportCtx.scale(scale, scale);
      exportCtx.drawImage(exportChartCanvas, 0, 0);

      // Generate professional filename based on datasets
      const leftPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-a');
      const rightPanelDatasets = processedDatasets.filter(d => d.panelId === 'dataset-b');
      
      let filename = '';
      if (leftPanelDatasets.length > 0 && rightPanelDatasets.length > 0) {
        const leftNames = leftPanelDatasets.map(d => d.filename.replace('.csv', '')).join('+');
        const rightNames = rightPanelDatasets.map(d => d.filename.replace('.csv', '')).join('+');
        filename = `${leftNames} vs ${rightNames}`;
      } else if (leftPanelDatasets.length > 0) {
        filename = leftPanelDatasets.map(d => d.filename.replace('.csv', '')).join('+');
      } else if (rightPanelDatasets.length > 0) {
        filename = rightPanelDatasets.map(d => d.filename.replace('.csv', '')).join('+');
      } else {
        filename = 'EMC_Spectrum_Analysis';
      }
      
      // Add timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const exportSuffix = exportType === 'original' ? '_Original' : '_Zoomed';
      filename = `${filename}${exportSuffix}_${timestamp}`;

      // Clean up temporary chart
      tempChart.destroy();

      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          console.log(`📸 Chart exported as: ${filename}.${format} (${exportType} view)`);
        }
      }, `image/${format}`, 0.95);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setVizState(prev => ({ ...prev, isExporting: false }));
    }
  }, [processedDatasets, calculateOptimalTicks, showLegend, vizState.customTitle, vizState.customLegendLabels]);

  // ========================================================================
  // CHART CONTROLS
  // ========================================================================

  // ========================================================================
  // EDIT FUNCTIONALITY
  // ========================================================================

  const handleTitleEdit = (newTitle: string) => {
    setVizState(prev => ({ 
      ...prev, 
      customTitle: newTitle,
      isEditingTitle: false
    }));
  };

  const handleLegendEdit = (datasetId: string, newLabel: string) => {
    setVizState(prev => ({ 
      ...prev, 
      customLegendLabels: {
        ...prev.customLegendLabels,
        [datasetId]: newLabel
      }
    }));
  };

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderEditControls = () => {
    if (csvOverlayState.datasets.length === 0) return null;

    return (
      <div className="edit-controls professional">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Title Edit Button */}
          <button 
            onClick={() => setVizState(prev => ({ ...prev, isEditingTitle: !prev.isEditingTitle }))}
            className="edit-btn"
            style={{
              backgroundColor: vizState.isEditingTitle ? '#e74c3c' : '#3498db',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {vizState.isEditingTitle ? 'Cancel' : 'Edit Title'}
          </button>

          {/* Legend Edit Button */}
          <button 
            onClick={() => setVizState(prev => ({ ...prev, isEditingLegend: !prev.isEditingLegend }))}
            className="edit-btn"
            style={{
              backgroundColor: vizState.isEditingLegend ? '#e74c3c' : '#2ecc71',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {vizState.isEditingLegend ? 'Done' : 'Edit Labels'}
          </button>

          {/* Reset Button */}
          <button 
            onClick={() => setVizState(prev => ({ 
              ...prev, 
              customTitle: '', 
              customLegendLabels: {},
              isEditingTitle: false,
              isEditingLegend: false
            }))}
            className="reset-btn"
            style={{
              backgroundColor: '#95a5a6',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Reset
          </button>

          {/* Export Button - Only Default View */}
          <button 
            onClick={() => exportChart('original', 'png')} 
            className="export-btn primary simple"
            disabled={vizState.isExporting || processedDatasets.length === 0}
            style={{
              backgroundColor: vizState.isExporting ? '#95a5a6' : '#e67e22',
              border: 'none',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '4px',
              fontWeight: '500',
              fontSize: '12px',
              cursor: vizState.isExporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {vizState.isExporting ? 'Exporting...' : 'Export Default View'}
          </button>
          </div>

        {/* Title Edit Input */}
        {vizState.isEditingTitle && (
          <div style={{ marginTop: '12px', textAlign: 'center' }}>
            <input
              type="text"
              placeholder="Enter custom chart title..."
              defaultValue={vizState.customTitle}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTitleEdit((e.target as HTMLInputElement).value);
                }
              }}
              onBlur={(e) => handleTitleEdit(e.target.value)}
              autoFocus
              style={{
                padding: '8px 12px',
                border: '2px solid #3498db',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'center',
                minWidth: '300px',
                maxWidth: '600px',
                width: '100%',
                fontFamily: 'Arial, sans-serif'
              }}
            />
            <div style={{ marginTop: '4px', fontSize: '10px', color: '#7f8c8d' }}>
              Press Enter or click away to save
            </div>
          </div>
        )}

        {/* Legend Edit Inputs */}
        {vizState.isEditingLegend && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '8px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              {processedDatasets.map((dataset) => (
                <div key={dataset.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div 
                    style={{ 
                      width: '16px', 
                      height: '16px', 
                      backgroundColor: dataset.color,
                      borderRadius: '50%',
                      flexShrink: 0,
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }}
                  />
                  <input
                    type="text"
                    placeholder={dataset.label}
                    defaultValue={vizState.customLegendLabels[dataset.id] || ''}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLegendEdit(dataset.id, (e.target as HTMLInputElement).value);
                      }
                    }}
                    onBlur={(e) => handleLegendEdit(dataset.id, e.target.value)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #2ecc71',
                      borderRadius: '4px',
                      fontSize: '12px',
                      flex: 1,
                      fontFamily: 'Arial, sans-serif'
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#7f8c8d', textAlign: 'center' }}>
              Press Enter or click away to save changes
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderControls = () => {
    if (!showControls || csvOverlayState.datasets.length === 0) return null;

    return (
      <div className="chart-controls professional compact">
        <div className="band-filter-control">
          <label htmlFor="band-filter-select" className="filter-label">
            Band Filter:
          </label>
          <select
            id="band-filter-select"
            value={vizState.selectedBand}
            onChange={(e) => setVizState(prev => ({ ...prev, selectedBand: e.target.value as BandType | 'all' }))}
            className="band-filter-select"
            style={{
              padding: '6px 12px',
              marginLeft: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          >
            <option value="all">Show All Data (No Filtering)</option>
            {Object.entries(BAND_DEFINITIONS).map(([bandType, definition]) => (
              <option key={bandType} value={bandType}>
                Filter to {bandType}: {definition.range}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // ========================================================================
  // MAIN RENDER
  // ========================================================================

  if (csvOverlayState.datasets.length === 0) {
    return (
      <div className="csv-visualization-empty professional">
        <div className="empty-state center-panel-empty">
          <div className="empty-icon">📈</div>
          <h3>EMC Spectrum Analysis</h3>
          <p>Select CSV files from the panels on the left and right to visualize and compare EMC spectrum data</p>
          <div className="features-list">
            <div className="feature">• Interactive Chart.js visualization</div>
            <div className="feature">• Professional export capabilities</div>
            <div className="feature">• Band detection and analysis</div>
            <div className="feature">• Side-by-side data comparison</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="csv-visualization professional">
      {renderControls()}
      
      <div className="chart-container professional">
        <Line
          ref={chartRef}
          data={chartData}
          options={chartOptions}
          width={width}
          height={height}
        />
      </div>

      {renderEditControls()}
    </div>
  );
};

export default CsvVisualization; 