# Python PCEP Correction Tools

## Overview
This directory contains Python utilities for **PCEP (Pre-Compliance EMC Program) correction** processing, specifically designed for Turner Engineering Corporation's EMC testing workflows.

## Files

### `pcep_correction.py` (221 lines)
**Primary PCEP correction application**
- Applies correction factors to EMC measurement data
- Handles both addition and subtraction of correction data
- Supports B5 (100kHz) and B6/B7 (300kHz) correction types
- Automatic file type detection from filename patterns
- Linear interpolation for correction factor application

**Key Features:**
- Processes multiple measurement files in batch
- Loads correction data from 06-16 and 06-26 calibration files
- Formula: `Corrected = Original + (06-26 correction) - (06-16 correction)`
- Preserves original file headers and metadata
- Exports corrected files with "correction added" suffix

### `plot_corrections.py` (556 lines) 
**Visualization and analysis tool**
- Generates comparison plots of original vs corrected data
- Statistical analysis of correction effectiveness
- Export plots in multiple formats (PNG, PDF, SVG)
- Correction factor visualization and validation

## Usage

### Prerequisites
```bash
pip install pandas numpy scipy matplotlib
```

### Basic Usage
1. Place measurement CSV files in the same directory
2. Ensure PCEP correction files are available:
   - `Bilogic 100kHz PCEP 2025-06-26.csv`
   - `Bilogic 300kHz PCEP 2025-06-26.csv`
   - `Bilogic 100kHz PCEP 2025-06-16.csv`
   - `Bilogic 300kHz PCEP 2025-06-16.csv`
3. Run the correction tool:
```bash
python pcep_correction.py
```

### File Naming Convention
The tool automatically detects correction type from filename:
- Files containing `B5H` or `B5V` → 100kHz correction
- Files containing `B6H`, `B6V`, `B7H`, or `B7V` → 300kHz correction

## Technical Details

### Correction Algorithm
1. Load measurement data from CSV files
2. Identify correction type from filename
3. Apply linear interpolation for frequency-specific corrections
4. Calculate: `Result = Measurement + Add_Correction - Subtract_Correction`
5. Export with preserved headers and metadata

### Data Format
- Input: CSV files with frequency (Hz) and amplitude (dBuV/m) columns
- Output: Corrected CSV files maintaining original format
- Frequency range support: 9 kHz to 6+ GHz

## Quality Assurance
- Comprehensive error handling for malformed files
- Statistical reporting of correction ranges and averages
- Data validation and range checking
- Preservation of measurement metadata

---
*Turner Engineering Corporation - Professional EMC Testing Tools* 