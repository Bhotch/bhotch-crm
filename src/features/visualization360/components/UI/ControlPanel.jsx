import React, { useRef, useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { Upload, Eye, EyeOff, Camera, Download, RefreshCw, Wand2, FileText, Calculator, Ruler } from 'lucide-react';
import { compressImage } from '../../utils/ImageProcessor';
import PhotoValidator from '../PhotoCapture/PhotoValidator';
import CameraIntegration from '../PhotoCapture/CameraIntegration';
import MeasurementTools from '../Tools/MeasurementTools';
import { autoPlacement } from '../../services/AutoPlacement';
import { photogrammetry } from '../../services/Photogrammetry';
import { pdfReportGenerator } from '../../services/PDFReportGenerator';
import { costEstimator } from '../../services/CostEstimator';

/**
 * Control Panel Component
 * Main control interface for the visualization tool
 */
export default function ControlPanel() {
  const fileInputRef = useRef();
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showValidator, setShowValidator] = useState(false);
  // const [showCamera, setShowCamera] = useState(false); // Reserved for future use
  // const [showMeasurement, setShowMeasurement] = useState(false); // Reserved for future use
  // const [showEstimate, setShowEstimate] = useState(false); // Reserved for future use
  const [activePanel, setActivePanel] = useState('main'); // 'main', 'camera', 'measurement', 'estimate'

  const {
    images,
    viewMode,
    setBeforeImage,
    setViewMode,
    ui,
    setLoading,
    resetAll,
    shingles,
    lighting,
    measurements,
    addShingleRegion,
    addLight,
  } = useVisualizationStore();

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingFile(file);
    setShowValidator(true);
  };

  const handleValidationComplete = async (result) => {
    if (result.valid) {
      setLoading(true);
      try {
        const compressed = await compressImage(uploadingFile, 2048, 0.9);
        setBeforeImage(compressed.url);
        setShowValidator(false);
        setUploadingFile(null);
      } catch (error) {
        console.error('Image upload error:', error);
        alert('Failed to process image');
      } finally {
        setLoading(false);
      }
    }
  };

  const viewModes = [
    { id: 'before', label: 'Before', icon: Eye },
    { id: 'after', label: 'After', icon: Eye },
    { id: 'compare', label: 'Compare', icon: EyeOff },
  ];

  /**
   * Auto-place products using AI
   */
  const handleAutoPlacement = async () => {
    if (!images.before) return;

    setLoading(true);
    try {
      const result = await autoPlacement.autoPlaceAll(images.before, {
        shingleColor: shingles.selectedColor,
        lightingPattern: 'uniform'
      });

      // Apply placements to store
      result.placements.shingles.forEach(placement => {
        addShingleRegion(placement);
      });

      result.placements.lighting.forEach(light => {
        addLight(light);
      });

      alert(`Auto-placement complete! Added ${result.placements.shingles.length} shingle regions and ${result.placements.lighting.length} lights.`);
    } catch (error) {
      console.error('Auto-placement failed:', error);
      alert('Auto-placement failed. Please try manual placement.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle photo capture completion
   */
  const handlePhotoCaptureComplete = async (photos) => {
    setLoading(true);
    try {
      // Process photos for photogrammetry
      const job = await photogrammetry.processPhotos(photos);

      alert(`Photos uploaded successfully! Processing job ID: ${job.jobId}. Estimated time: ${Math.floor(job.estimatedTime / 60)} minutes.`);

      // Poll for status
      // In production, this would be handled with websockets or polling
      // setShowCamera(false); // Reserved for future camera integration
      setActivePanel('main');
    } catch (error) {
      console.error('Photo processing failed:', error);
      alert(`Photo processing failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate PDF report
   */
  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const estimate = costEstimator.calculateEstimate({
        measurements,
        shingleColor: shingles.selectedColor,
        lightingLength: lighting.lights.length * 12,
        includeRidgeVent: true,
        includeGutters: false
      });

      const projectData = {
        projectName: 'Roof Visualization Project',
        customerName: 'Customer Name',
        address: '123 Main St',
        images,
        measurements,
        shingleColor: shingles.selectedColor,
        estimate
      };

      await pdfReportGenerator.save(projectData, `project-report-${Date.now()}.pdf`);

      alert('PDF report generated successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="control-panel bg-white rounded-lg shadow-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Controls</h3>
        <button
          onClick={resetAll}
          className="text-gray-500 hover:text-gray-700 p-1"
          title="Reset All"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Image Upload */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700">House Image</h4>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ui.isLoading}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {images.before ? 'Change Image' : 'Upload House Photo'}
        </button>
        {images.before && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            ✓ Image loaded successfully
          </p>
        )}
      </div>

      {/* Image Validation */}
      {showValidator && uploadingFile && (
        <PhotoValidator
          file={uploadingFile}
          onValidationComplete={handleValidationComplete}
        />
      )}

      {/* View Mode Selection */}
      {images.before && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700">View Mode</h4>
          <div className="grid grid-cols-3 gap-2">
            {viewModes.map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    viewMode === mode.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Phase 2 Features */}
      {images.before && activePanel === 'main' && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold mb-2 text-gray-700 flex items-center gap-2">
            Phase 2 Features
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">NEW</span>
          </h4>
          <div className="space-y-2">
            {/* AI Auto-Placement */}
            <button
              onClick={handleAutoPlacement}
              disabled={ui.isLoading}
              className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              AI Auto-Placement
            </button>

            {/* Measurement Tools */}
            <button
              onClick={() => setActivePanel('measurement')}
              className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Ruler className="w-4 h-4" />
              Measurement Tools
            </button>

            {/* 8-Photo Capture */}
            <button
              onClick={() => setActivePanel('camera')}
              className="w-full py-2 px-3 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              8-Photo Capture (3D)
            </button>

            {/* Cost Estimator */}
            <button
              onClick={() => setActivePanel('estimate')}
              className="w-full py-2 px-3 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="w-4 h-4" />
              Cost Estimate
            </button>

            {/* PDF Report */}
            <button
              onClick={handleGenerateReport}
              disabled={ui.isLoading}
              className="w-full py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              Generate PDF Report
            </button>

            {/* Export Image */}
            <button
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `visualization-${Date.now()}.png`;
                    a.click();
                  });
                }
              }}
              className="w-full py-2 px-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Image
            </button>
          </div>
        </div>
      )}

      {/* Camera Panel */}
      {activePanel === 'camera' && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setActivePanel('main')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Main
          </button>
          <CameraIntegration onComplete={handlePhotoCaptureComplete} />
        </div>
      )}

      {/* Measurement Panel */}
      {activePanel === 'measurement' && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setActivePanel('main')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Main
          </button>
          <MeasurementTools />
        </div>
      )}

      {/* Cost Estimate Panel */}
      {activePanel === 'estimate' && (
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => setActivePanel('main')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-3"
          >
            ← Back to Main
          </button>
          <div className="bg-gray-50 rounded p-3">
            <h4 className="font-semibold text-gray-800 mb-2">Quick Estimate</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Roof Area:</span>
                <span className="font-medium">{measurements.roofArea || 0} sq ft</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shingles:</span>
                <span className="font-medium">{shingles.selectedColor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lighting:</span>
                <span className="font-medium">{lighting.lights.length} fixtures</span>
              </div>
            </div>
            <button
              onClick={handleGenerateReport}
              className="w-full mt-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
            >
              Generate Full Report
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      {activePanel === 'main' && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>How to use:</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 pl-4">
            <li>• Upload a house photo to begin</li>
            <li>• Use AI Auto-Placement for instant results</li>
            <li>• Measure roof surfaces with tools</li>
            <li>• Capture 8 photos for 3D reconstruction</li>
            <li>• Generate cost estimates & PDF reports</li>
            <li>• Export final visualization</li>
          </ul>
        </div>
      )}
    </div>
  );
}
