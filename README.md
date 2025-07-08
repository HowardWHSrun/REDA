# REDA EMC Testing Tool

**Professional EMC spectrum analysis and data comparison tool by Turner Engineering Corporation**

*Latest Version: V5.0.0 - Professional Interface Overhaul*

## Overview

REDA analyzes EMC test data by comparing CSV files side-by-side with professional visualization capabilities. The tool features interactive Chart.js visualizations, band detection, noise analysis, and high-quality export functionality for professional EMC testing workflows.

## Features

✨ **Professional Interface**
- Beautiful welcome guide for new users
- Three-panel layout: Dataset A | EMC Analysis | Dataset B
- Professional matplotlib-inspired chart styling
- Mobile-responsive design

🔧 **Advanced Analysis**
- Automatic EMC frequency band detection (B0-B7)
- Band-relative noise analysis (1-10 scale)
- Side-by-side data comparison
- Interactive zoom and pan capabilities

📊 **Visualization & Export**
- High-quality Chart.js visualizations
- Professional PNG export (2400x1200px)
- Custom chart titles and labels
- Zoom view exports

## Quick Start

### 🌐 Web Version (Easiest)
Visit: https://turner-engineering.github.io/reda/

### 💻 Local Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

In the project directory, you can run:

#### `npm start`
Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

#### `npm test`
Launches the test runner in interactive watch mode.

#### `npm run build`
Builds the app for production to the `build` folder.\
Optimizes the build for best performance with minified files.

#### `npm run eject`
**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## How to Use

1. **Open Folder**: Click on panel titles or empty states to select CSV file folders
2. **Load Data**: Select CSV files from your EMC testing equipment
3. **Analyze**: View automatic band detection and noise analysis
4. **Compare**: Load datasets in both panels for side-by-side comparison
5. **Export**: Generate professional charts for reports and documentation

## CSV Format

Your EMC test files should contain frequency and amplitude columns:

```csv
Frequency (MHz),Amplitude (dBμV/m)
30.0,65.2
30.1,64.8
30.2,63.9
...
```

Supported formats:
- Frequency in Hz, kHz, MHz, or GHz
- Amplitude in dBμV/m or similar units
- Headers are automatically detected

## EMC Frequency Bands

REDA automatically detects and categorizes data by EMC frequency bands:

- **B0**: 0.15-0.5 MHz
- **B1**: 0.5-5 MHz  
- **B2**: 5-30 MHz
- **B3**: 30-100 MHz
- **B4**: 100-300 MHz
- **B5**: 300-1000 MHz
- **B6**: 1-3 GHz
- **B7**: 3-18 GHz

## Version History

### V5.0.0 - Professional Interface Overhaul
- ✨ Beautiful welcome guide with step-by-step tutorial
- 🎨 Professional empty states with better spacing
- 🔧 Smart button controls and enhanced UX
- 📱 Improved mobile responsiveness
- 🎯 Professional polish throughout

### Previous Versions
- V4.x: Chart.js integration and export capabilities
- V3.x: Band detection and noise analysis
- V2.x: TypeScript/React migration
- V1.x: Original JavaScript implementation

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Visualization**: Chart.js with professional styling
- **File Access**: File System Access API
- **Styling**: Modern CSS with CSS Grid/Flexbox
- **Build**: Create React App with custom optimizations

## Legacy Versions

**📁 Legacy JavaScript Version:** `archive/legacy-javascript-version/index.html`
- Original implementation for compatibility
- No build process required
- Direct browser usage

**🐍 Python Tools:** `archive/python-tools/`
- PCEP correction utilities
- Data processing scripts
- Analysis helpers

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
- [Chart.js documentation](https://www.chartjs.org/docs/)

---

**Turner Engineering Corporation**  
*Professional EMC Testing Support*
