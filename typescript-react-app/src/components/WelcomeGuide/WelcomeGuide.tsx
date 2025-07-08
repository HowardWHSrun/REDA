import React, { useState, useEffect } from 'react';
import './WelcomeGuide.css';

interface WelcomeGuideProps {
  isVisible: boolean;
  onClose: () => void;
}

export const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to REDA EMC Testing Tool",
      content: "Professional EMC spectrum analysis and data comparison tool by Turner Engineering Corporation.",
      highlight: null,
      icon: "🎯"
    },
    {
      title: "Dataset A Panel (Left)",
      content: "Load your primary dataset here. Select CSV files containing EMC frequency spectrum data. Files are automatically categorized by frequency band (B0-B7) and analyzed for noise levels.",
      highlight: "dataset-a",
      icon: "📊"
    },
    {
      title: "EMC Spectrum Analysis (Center)",
      content: "Interactive Chart.js visualization displays your selected data. Compare multiple datasets, zoom, export, and analyze spectrum patterns with professional precision.",
      highlight: "chart",
      icon: "📈"
    },
    {
      title: "Dataset B Panel (Right)",
      content: "Load your comparison dataset here. Perfect for before/after analysis, compliance testing, or multi-condition comparisons. Works independently from Dataset A.",
      highlight: "dataset-b",
      icon: "📋"
    },
    {
      title: "Getting Started",
      content: "1. Click 'Select Your Dataset Folder' in either panel\n2. Choose CSV files from your EMC testing equipment\n3. View automatic band detection and noise analysis\n4. Compare datasets side-by-side in the chart\n5. Export results for reports",
      highlight: null,
      icon: "🚀"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipGuide = () => {
    onClose();
  };

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      
      // Add highlight classes to elements
      const step = steps[currentStep];
      if (step.highlight) {
        document.querySelectorAll('.guide-highlight').forEach(el => {
          el.classList.remove('guide-highlight');
        });
        
        const targetElement = document.querySelector(`[data-panel-id="${step.highlight}"], [data-guide-id="${step.highlight}"]`);
        if (targetElement) {
          targetElement.classList.add('guide-highlight');
        }
      }
    } else {
      // Remove all highlights when guide closes
      document.querySelectorAll('.guide-highlight').forEach(el => {
        el.classList.remove('guide-highlight');
      });
    }
  }, [isVisible, currentStep]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide-modal">
        <div className="guide-header">
          <div className="guide-icon">{currentStepData.icon}</div>
          <h2>{currentStepData.title}</h2>
          <button className="close-btn" onClick={skipGuide}>✕</button>
        </div>
        
        <div className="guide-content">
          <p>{currentStepData.content}</p>
        </div>
        
        <div className="guide-progress">
          <div className="progress-dots">
            {steps.map((_, index) => (
              <div 
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
          <div className="progress-text">
            {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        <div className="guide-actions">
          <button 
            className="guide-btn secondary" 
            onClick={skipGuide}
          >
            Skip Guide
          </button>
          <div className="navigation-buttons">
            {currentStep > 0 && (
              <button 
                className="guide-btn secondary" 
                onClick={prevStep}
              >
                Previous
              </button>
            )}
            <button 
              className="guide-btn primary" 
              onClick={nextStep}
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide; 