# REDA EMC Testing Tool - TypeScript React Application

## Overview
This is the **modern TypeScript React implementation** of the REDA EMC Testing Tool for Turner Engineering Corporation. This represents the current development version with professional UI/UX, modern architecture, and enhanced functionality.

## Current Features (Implemented)
- ✅ **Professional Folder Browser System**: File System Access API integration
- ✅ **Two-Dataset Comparison**: Side-by-side spectrum analysis
- ✅ **Smart Band Detection**: Automatic frequency band identification (B0-B7)
- ✅ **Professional Visualization**: Chart.js-based spectrum plotting
- ✅ **High-Resolution Export**: 300 DPI PNG exports with metadata
- ✅ **Color-Coded Interface**: Blue/Orange panel system for dataset distinction
- ✅ **Responsive Design**: Full viewport utilization with responsive layout
- ✅ **TypeScript Safety**: Complete type checking and interfaces

## Architecture

### Technology Stack
- **React 19.1.0**: Modern functional components with hooks
- **TypeScript 4.9.5**: Type-safe development
- **Chart.js 4.5.0**: Professional data visualization
- **File System Access API**: Modern browser file handling
- **CSS Custom Properties**: Dynamic theming system

### Project Structure
```
src/
├── components/           # Reusable React components
│   ├── CsvUpload/       # File upload functionality
│   ├── CsvVisualization/ # Chart rendering and controls
│   ├── FolderBrowser/   # Folder selection interface
│   ├── ModeSelector/    # Application mode switching
│   └── index.ts         # Component exports
├── context/             # React Context API state management
├── services/            # Business logic and data processing
├── types/               # TypeScript type definitions
├── constants/           # Application configuration
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

### Key Components

#### `FolderBrowser` 
- Professional folder selection interface
- File filtering and band detection
- Selection validation and management
- Support for multiple file selection

#### `CsvVisualization`
- Chart.js integration for spectrum plotting
- Interactive zoom and pan controls
- Professional export functionality
- Real-time data processing

#### `CsvService`
- CSV file parsing and validation
- Band detection algorithms
- Data processing and filtering
- Error handling and reporting

## Development

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
```
Runs the app at http://localhost:3000

### Build for Production
```bash
npm run build
```
Creates optimized production build in `build/` directory

### Deployment
The app is configured for GitHub Pages deployment:
```bash
npm run deploy
```

## Feature Roadmap

### Phase 1: Core Functionality (Completed)
- ✅ Folder browsing and file selection
- ✅ CSV parsing and visualization
- ✅ Two-dataset comparison
- ✅ Professional export system

### Phase 2: Advanced Features (In Development)
- 🚧 Peak detection and annotation
- 🚧 Limit line overlays
- 🚧 Multi-page workflow support
- 🚧 Enhanced export formats

### Phase 3: Feature Parity (Planned)
- 📋 Image annotation mode
- 📋 EMI correction functionality
- 📋 Band database integration
- 📋 Professional reporting system

## Technical Specifications

### Browser Compatibility
- Chrome 85+ (File System Access API)
- Firefox 110+ (limited file handling)
- Safari 15+ (limited file handling)
- Edge 85+ (full functionality)

### Performance
- Real-time CSV processing up to 10,000+ data points
- Responsive UI with 60fps animations
- Memory-efficient data handling
- Optimized chart rendering

### Data Formats
- **Input**: CSV files with frequency/amplitude columns
- **Output**: High-resolution PNG (300 DPI equivalent)
- **Frequency Range**: 9 kHz to 6+ GHz
- **Amplitude Units**: dBuV/m, dBµV/m

## Quality Assurance

### Type Safety
- Complete TypeScript coverage
- Interface definitions for all data structures
- Compile-time error checking
- IDE integration and IntelliSense

### Error Handling
- Comprehensive file validation
- User-friendly error messages
- Graceful degradation for unsupported browsers
- Debug logging and monitoring

### Testing
- Component unit tests (Jest/React Testing Library)
- Integration tests for file processing
- End-to-end workflow validation
- Cross-browser compatibility testing

## Professional Features

### Export Quality
- 300 DPI equivalent resolution (3600x2400 pixels)
- Professional typography and branding
- Metadata inclusion for traceability
- Multiple format support (PNG, SVG planned)

### UI/UX Design
- Professional color scheme (blue/orange)
- Consistent spacing and typography
- Responsive design for all screen sizes
- Accessibility considerations (ARIA labels, keyboard navigation)

### Data Processing
- Smart band detection algorithms
- Frequency range validation
- Amplitude scaling and normalization
- Statistical analysis and reporting

---
*Turner Engineering Corporation - Professional EMC Testing Tools*
*Developed by Howard Wang | Supervised by Temba Mateke* 