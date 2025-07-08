# Legacy JavaScript Version - EMC Testing Tool

## Overview
This directory contains the complete, fully-functional **legacy JavaScript version** of the EMC Testing Tool developed for Turner Engineering Corporation. This is a mature, feature-complete application that was built before the TypeScript React rewrite.

## Features (Fully Implemented)
- **Multi-format support**: Image annotation and CSV data visualization
- **Professional export system**: High-resolution PNG exports with corporate branding
- **EMI correction functionality**: Complete PCEP correction workflow
- **Band identification system**: 8 frequency bands (B0-B7) with comprehensive FCC/ITU databases
- **Peak detection and annotation**: Automatic and manual peak identification
- **Multi-page workflow**: Support for complex testing scenarios
- **Professional documentation**: Tenco-compliant export formatting

## File Structure

### Core Application Files
- `script.js` (8,679 lines) - Main application with all functionality
- `emi-correction.js` (915 lines) - EMI measurement correction system
- `index.html` (627 lines) - Complete HTML interface
- `styles.css` (5,695 lines) - Comprehensive styling system

### Database Files (`databases/`)
- `peak-identification-database-band0.js` through `band7.js`
- Complete FCC frequency allocation databases
- Covers 9 kHz to 6+ GHz spectrum
- 400+ individual frequency segments with full regulatory data

### Assets (`assets/`)
- `tenco-logo.png` - Corporate branding assets
- Additional logos and graphics

## Technical Specifications
- **Client-side processing**: No server required
- **Cross-browser compatibility**: Chrome, Firefox, Safari, Edge
- **Professional typography**: Arial Bold, Times New Roman
- **High-resolution exports**: 300 DPI equivalent PNG output
- **Real-time visualization**: HTML5 Canvas-based rendering

## Usage
This version can be run directly by opening `index.html` in any modern web browser. All functionality is contained within these files and requires no additional installation or build process.

## Development History
This represents the mature, stable version of the EMC Testing Tool that was in production use before the TypeScript React modernization effort began.

---
*Turner Engineering Corporation - Professional EMC Testing Tools* 