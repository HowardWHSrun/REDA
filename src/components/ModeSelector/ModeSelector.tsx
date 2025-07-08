// ========================================================================
// REDA EMC Testing Tool - Mode Selector Component
// ========================================================================
// Turner Engineering Corporation - Professional EMC Testing Support
// 
// Mode selection tabs for switching between CSV, Image, and Correction modes
// ========================================================================

import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { ApplicationMode } from '../../types';
import './ModeSelector.css';

// ========================================================================
// MODE CONFIGURATION
// ========================================================================

interface ModeConfig {
  mode: ApplicationMode;
  icon: string;
  text: string;
  subtitle: string;
  description: string;
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    mode: 'csv',
    icon: '📊',
    text: 'CSV Data Files',
    subtitle: 'Spectrum Analysis',
    description: 'Analyze and compare EMC spectrum data from CSV files'
  },
  {
    mode: 'images',
    icon: '📷',
    text: 'Image Files',
    subtitle: 'Visual Documentation',
    description: 'Annotate and export EMC test images'
  },
  {
    mode: 'correction',
    icon: '⚡',
    text: 'EMI Correction',
    subtitle: 'Data Correction',
    description: 'Apply PCEP corrections to measurement data'
  }
];

// ========================================================================
// MODE SELECTOR COMPONENT
// ========================================================================

export const ModeSelector: React.FC = () => {
  const { state, setMode } = useAppContext();
  const currentMode = state.currentMode;

  const handleModeChange = (mode: ApplicationMode) => {
    setMode(mode);
  };

  return (
    <div className="mode-selector">
      <div className="mode-tabs">
        {MODE_CONFIGS.map((config) => (
          <button
            key={config.mode}
            className={`mode-tab ${config.mode}-mode ${currentMode === config.mode ? 'active' : ''}`}
            onClick={() => handleModeChange(config.mode)}
            title={config.description}
            data-mode={config.mode}
          >
            <span className="mode-icon">{config.icon}</span>
            <span className="mode-text">{config.text}</span>
            <span className="mode-subtitle">{config.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector; 