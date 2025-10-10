import React, { useRef, useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { Upload, Eye, EyeOff, Camera, Download, RefreshCw, Wand2, FileText, Calculator, Ruler, Share2, Filter } from 'lucide-react';
import { compressImage } from '../../utils/ImageProcessor';
import PhotoValidator from '../PhotoCapture/PhotoValidator';
import CameraIntegration from '../PhotoCapture/CameraIntegration';
import MeasurementTools from '../Tools/MeasurementTools';
import { autoPlacement } from '../../services/AutoPlacement';
import { photogrammetry } from '../../services/Photogrammetry';
import { pdfReportGenerator } from '../../services/PDFReportGenerator';
import { costEstimator } from '../../services/CostEstimator';
import { ai3DModelGenerator } from '../../services/AI3DModelGenerator';

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
    setUploadProgress,
    resetAll,
    shingles,
    lighting,
    measurements,
    addShingleRegion,
    addLight,
    model3D,
    set3DModel,
    addCapturedImage,
  } = useVisualizationStore();

  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // For single file, use existing validation flow
    if (files.length === 1) {
      setUploadingFile(files[0]);
      setShowValidator(true);
      return;
    }

    // For multiple files (up to 8), process directly for 3D reconstruction
    const maxFiles = Math.min(files.length, 8);

    setLoading(true);
    setUploadProgress(10);

    try {
      const photoArray = [];

      // Compress and prepare images
      for (let i = 0; i < maxFiles; i++) {
        const compressed = await compressImage(files[i], 2048, 0.9);
        photoArray.push({
          id: Date.now() + i,
          angle: `photo-${i + 1}`,
          name: files[i].name,
          file: compressed.file,
          preview: compressed.url,
          timestamp: new Date().toISOString()
        });

        // Store in captured images
        addCapturedImage(photoArray[i]);

        setUploadProgress(10 + (i / maxFiles) * 20);
      }

      // Set the first image as the before image for visualization
      setBeforeImage(photoArray[0].preview);
      setUploadProgress(30);

      // Generate 3D model using AI
      console.log(`Generating 3D model from ${photoArray.length} images...`);
      setUploadProgress(40);

      const modelData = await ai3DModelGenerator.generateModel(photoArray, {
        quality: photoArray.length >= 8 ? 'high' : 'medium',
        includeTextures: true,
        optimizeForWeb: true,
      });

      setUploadProgress(80);

      // Store the 3D model
      set3DModel({
        data: modelData,
        type: modelData.type,
        url: modelData.url,
        isGenerated: true,
        generationMethod: modelData.method,
        quality: modelData.quality,
      });

      setUploadProgress(100);

      alert(`✅ 3D Model generated successfully!\n\nMethod: ${modelData.method}\nQuality: ${modelData.quality}\n\nSwitch to 3D view to see your realistic house model.`);
    } catch (error) {
      console.error('Image upload and 3D generation error:', error);
      alert('Failed to process images: ' + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleValidationComplete = async (result) => {
    if (result.cancelled) {
      // User cancelled or chose to pick a different image
      setShowValidator(false);
      setUploadingFile(null);
      return;
    }

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

  /**
   * Share visualization via Web Share API or fallback to copy link
   */
  const handleShare = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('No visualization to share. Please upload an image first.');
      return;
    }

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        const file = new File([blob], `visualization-${Date.now()}.png`, { type: 'image/png' });

        // Check if Web Share API is available
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Roof Visualization',
            text: 'Check out this roof visualization!',
            files: [file]
          });
          alert('Shared successfully!');
        } else {
          // Fallback: Copy image to clipboard or download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `visualization-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);

          alert('Visualization downloaded! You can now share the image file.');
        }
      }, 'image/png');
    } catch (error) {
      console.error('Share failed:', error);
      alert('Failed to share. Please try the Export button instead.');
    }
  };

  /**
   * Toggle filter panel
   */
  const [showFilters, setShowFilters] = useState(false);
  const [imageFilters, setImageFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0
  });

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
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={ui.isLoading}
          className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4" />
          {images.before ? 'Change Image' : 'Upload Photo(s) - Up to 8'}
        </button>
        {images.before && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            ✓ Image loaded successfully
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Single photo or multiple photos (max 8, 10MB each) for 3D reconstruction
        </p>
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

            {/* Share */}
            <button
              onClick={handleShare}
              className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Visualization
            </button>

            {/* Image Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full py-2 px-3 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Image Filters'}
            </button>

            {/* Filter Controls */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                <h5 className="font-semibold text-gray-800 text-sm">Adjust Image</h5>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Brightness: {imageFilters.brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageFilters.brightness}
                    onChange={(e) => {
                      setImageFilters({...imageFilters, brightness: e.target.value});
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        canvas.style.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation}%) blur(${imageFilters.blur}px)`;
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Contrast: {imageFilters.contrast}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageFilters.contrast}
                    onChange={(e) => {
                      setImageFilters({...imageFilters, contrast: e.target.value});
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        canvas.style.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation}%) blur(${imageFilters.blur}px)`;
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Saturation: {imageFilters.saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={imageFilters.saturation}
                    onChange={(e) => {
                      setImageFilters({...imageFilters, saturation: e.target.value});
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        canvas.style.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation}%) blur(${imageFilters.blur}px)`;
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Blur: {imageFilters.blur}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={imageFilters.blur}
                    onChange={(e) => {
                      setImageFilters({...imageFilters, blur: e.target.value});
                      const canvas = document.querySelector('canvas');
                      if (canvas) {
                        canvas.style.filter = `brightness(${imageFilters.brightness}%) contrast(${imageFilters.contrast}%) saturate(${imageFilters.saturation}%) blur(${imageFilters.blur}px)`;
                      }
                    }}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={() => {
                    setImageFilters({ brightness: 100, contrast: 100, saturation: 100, blur: 0 });
                    const canvas = document.querySelector('canvas');
                    if (canvas) {
                      canvas.style.filter = 'none';
                    }
                  }}
                  className="w-full py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300"
                >
                  Reset Filters
                </button>
              </div>
            )}
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

      {/* 3D Model Status */}
      {model3D.isGenerated && activePanel === 'main' && (
        <div className="pt-4 border-t border-gray-200">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-800 text-sm mb-2 flex items-center gap-2">
              <Download className="w-4 h-4" />
              3D Model Generated
            </h4>
            <div className="text-xs text-green-700 space-y-1">
              <div><strong>Method:</strong> {model3D.generationMethod}</div>
              <div><strong>Quality:</strong> {model3D.quality}</div>
              <div><strong>Type:</strong> {model3D.type}</div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Click "3D Model" button at the top to see your realistic house visualization
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {activePanel === 'main' && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <strong>🚀 How to use:</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 pl-4">
            <li>• Upload 1 photo for 360° view</li>
            <li>• Upload 2-8 photos for 3D/4D model generation</li>
            <li>• Use AI Auto-Placement for instant product visualization</li>
            <li>• Apply shingles and lighting in the right panel</li>
            <li>• Measure roof surfaces with tools</li>
            <li>• Generate cost estimates & PDF reports</li>
            <li>• Export and share final visualization</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
            <strong>💡 Pro Tip:</strong> For best 3D results, capture photos from different angles around the house including aerial views
          </div>
        </div>
      )}
    </div>
  );
}
