import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Sliders,
  Download,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Zap,
  DollarSign,
  Camera,
  FileText,
  Mail,
  Save,
  MapPin,
  TrendingUp,
  Info
} from 'lucide-react';
import {
  generateLightingVisualization,
  getLightingStyles,
  getAIProviders,
  detectRoofline,
  calculateCostEstimate
} from '../services/AILightingService';
import { validateImage } from '../utils/ImageProcessor';

/**
 * Before/After Comparison Slider Component
 */
const BeforeAfterSlider = ({ beforeImage, afterImage, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);

      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [isDragging, handleMouseUp, handleMouseMove, handleTouchMove]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Before Image (Full) */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt="Before"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
          Before
        </div>
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={afterImage}
          alt="After"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          With Rime Lighting
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-700 absolute left-1" />
          <ChevronRight className="w-4 h-4 text-gray-700 absolute right-1" />
        </div>
      </div>
    </div>
  );
};

/**
 * Multi-Photo Upload Zone Component
 */
const MultiPhotoUploadZone = ({ photos, onUpload, maxPhotos = 4, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = async (files) => {
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        const validation = await validateImage(file);
        onUpload(file, validation);
      } catch (error) {
        alert(`Error with ${file.name}: ${error.message}`);
      }
    }
  };

  const angles = ['Front', 'Right Side', 'Left Side', 'Back'];

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 transition ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing || photos.length >= maxPhotos}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {angles.map((angle, idx) => (
          <div
            key={angle}
            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center ${
              photos[idx] ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            {photos[idx] ? (
              <div className="relative w-full h-full">
                <img
                  src={photos[idx].url}
                  alt={angle}
                  className="w-full h-full object-cover rounded-lg"
                />
                <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {angle}
                </div>
              </div>
            ) : (
              <>
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-600">{angle}</span>
                <span className="text-xs text-gray-400">Optional</span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing || photos.length >= maxPhotos}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
        >
          <Upload className="w-5 h-5" />
          {photos.length === 0 ? 'Upload House Photos' : `Add More (${photos.length}/${maxPhotos})`}
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Upload 1-4 photos from different angles for best results • JPG/PNG • Min 800x600
        </p>
      </div>
    </div>
  );
};

/**
 * Cost Estimate Display Component
 */
const CostEstimateDisplay = ({ costData, rooflineData }) => {
  if (!costData) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Professional Installation Estimate</h3>
          <p className="text-sm text-gray-600">Based on detected house dimensions</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{costData.linearFeet}'</div>
          <div className="text-xs text-gray-600">Linear Feet</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{costData.fixtureCount}</div>
          <div className="text-xs text-gray-600">LED Fixtures</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">${Math.round(costData.pricePerFoot)}</div>
          <div className="text-xs text-gray-600">Per Foot</div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Rime Eave Track & LEDs</span>
          <span className="font-semibold text-gray-900">${costData.breakdown.materials.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Professional Installation</span>
          <span className="font-semibold text-gray-900">${costData.breakdown.installation.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Smart Controller (100M Colors)</span>
          <span className="font-semibold text-gray-900">${costData.breakdown.controller.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Power Supply</span>
          <span className="font-semibold text-gray-900">${costData.breakdown.powerSupply.toLocaleString()}</span>
        </div>
        <div className="border-t border-gray-300 pt-2"></div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">${costData.breakdown.subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax (8%)</span>
          <span className="font-semibold text-gray-900">${Math.round(costData.breakdown.tax).toLocaleString()}</span>
        </div>
        <div className="border-t-2 border-green-300 pt-3 mt-2"></div>
        <div className="flex justify-between">
          <span className="text-lg font-bold text-gray-900">Total Investment</span>
          <span className="text-2xl font-bold text-green-600">${Math.round(costData.breakdown.total).toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Estimated from photo:</strong> ~{costData.estimatedWidthFeet}ft wide house.
            Final quote will be based on exact measurements during free on-site consultation.
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Lighting Style Selector Component
 */
const LightingStyleSelector = ({ selectedStyle, onSelectStyle, intensity, onIntensityChange }) => {
  const styles = getLightingStyles();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Lightbulb className="w-4 h-4" />
        Lighting Style (100 Million Colors)
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(styles).map(([key, style]) => (
          <button
            key={key}
            onClick={() => onSelectStyle(key)}
            className={`p-3 rounded-lg border-2 transition text-left ${
              selectedStyle === key
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div
              className="w-full h-8 rounded mb-2 border border-gray-200"
              style={{ backgroundColor: style.color }}
            />
            <div className="text-xs font-medium text-gray-900">{style.name}</div>
            <div className="text-xs text-gray-500">{style.temperature}</div>
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Brightness
          </span>
          <span className="text-blue-600 font-bold">{intensity}%</span>
        </label>
        <input
          type="range"
          min="20"
          max="100"
          value={intensity}
          onChange={(e) => onIntensityChange(parseInt(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-gray-300 via-yellow-400 to-yellow-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  );
};

/**
 * Main House Visualizer Component with All Upgrades
 */
export default function HouseVisualizerWithLighting() {
  const [photos, setPhotos] = useState([]);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('warmWhite');
  const [intensity, setIntensity] = useState(80);
  const [rooflineData, setRooflineData] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);

  const handleUpload = useCallback((file, validation) => {
    const url = URL.createObjectURL(file);
    setPhotos(prev => [...prev, { file, url, validation, angle: ['Front', 'Right Side', 'Left Side', 'Back'][prev.length] }]);
    setError(null);

    // Auto-detect roofline for first photo
    if (photos.length === 0 && autoDetectEnabled) {
      detectRoofline(file).then(roofline => {
        setRooflineData(roofline);
        const cost = calculateCostEstimate(validation, roofline);
        setCostEstimate(cost);
      }).catch(err => {
        console.error('Roofline detection failed:', err);
      });
    }
  }, [photos.length, autoDetectEnabled]);

  const handleRemovePhoto = useCallback((index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setGeneratedImages(prev => prev.filter((_, i) => i !== index));
    if (activePhotoIndex >= photos.length - 1) {
      setActivePhotoIndex(Math.max(0, photos.length - 2));
    }
  }, [activePhotoIndex, photos.length]);

  const handleGenerate = useCallback(async () => {
    if (photos.length === 0) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    setGeneratedImages([]);

    try {
      const results = [];

      for (let i = 0; i < photos.length; i++) {
        setProcessingStatus(`Processing ${photos[i].angle} view...`);
        setProcessingProgress(Math.floor((i / photos.length) * 100));

        const result = await generateLightingVisualization(
          photos[i].file,
          selectedStyle,
          intensity,
          {
            preferredProvider: getAIProviders().CANVAS_FALLBACK,
            rooflineData: i === 0 ? rooflineData : null, // Use detected roofline for first photo
            onProgress: (progress) => {
              setProcessingProgress(Math.floor((i / photos.length) * 100 + (progress.progress / photos.length)));
            }
          }
        );

        results.push(result.final);
      }

      setGeneratedImages(results);
      setProcessingProgress(100);
    } catch (err) {
      setError(`Failed to generate visualization: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  }, [photos, selectedStyle, intensity, rooflineData]);

  const handleDownload = useCallback(() => {
    if (generatedImages.length === 0) return;

    const activeImage = generatedImages[activePhotoIndex];
    if (!activeImage) return;

    const link = document.createElement('a');
    link.href = activeImage.url;
    link.download = `rime-lighting-${photos[activePhotoIndex].angle.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImages, activePhotoIndex, photos]);

  const handleDownloadAll = useCallback(() => {
    generatedImages.forEach((img, idx) => {
      const link = document.createElement('a');
      link.href = img.url;
      link.download = `rime-lighting-${photos[idx].angle.toLowerCase().replace(' ', '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }, [generatedImages, photos]);

  const handleSaveToProject = useCallback(() => {
    // Integration with CRM - would connect to actual CRM API
    const projectData = {
      photos: photos.map(p => p.url),
      generatedImages: generatedImages.map(g => g.url),
      lightingStyle: selectedStyle,
      intensity,
      costEstimate,
      rooflineData,
      timestamp: new Date().toISOString()
    };

    console.log('Saving to project:', projectData);
    alert('Visualization saved to customer project! (Integration with CRM pending)');
  }, [photos, generatedImages, selectedStyle, intensity, costEstimate, rooflineData]);

  const handleEmailCustomer = useCallback(() => {
    // Email functionality - would integrate with email service
    alert('Email preview would open here with before/after images and cost estimate');
  }, []);

  const handleExportPDF = useCallback(() => {
    // PDF export - would use jsPDF or similar
    alert('PDF report generation coming soon!');
  }, []);

  const handleReset = useCallback(() => {
    setPhotos([]);
    setGeneratedImages([]);
    setRooflineData(null);
    setCostEstimate(null);
    setActivePhotoIndex(0);
    setError(null);
    setIsProcessing(false);
  }, []);

  const activePhoto = photos[activePhotoIndex];
  const activeGenerated = generatedImages[activePhotoIndex];

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Rime Lighting Visualizer Pro
              </h1>
              <p className="text-sm text-gray-600">
                AI-powered house lighting preview • 100 Million Colors • Instant Estimates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {photos.length > 0 && !isProcessing && (
              <>
                <button
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="px-4 py-2 text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition flex items-center gap-2 border border-green-200"
                >
                  <DollarSign className="w-4 h-4" />
                  {showCostBreakdown ? 'Hide' : 'Show'} Estimate
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Start Over
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100%-80px)] overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {photos.length === 0 ? (
              /* Upload State */
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <MultiPhotoUploadZone
                  photos={photos}
                  onUpload={handleUpload}
                  maxPhotos={4}
                  isProcessing={isProcessing}
                />

                {/* Feature Highlights */}
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Camera className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Multi-Angle Views
                    </h3>
                    <p className="text-xs text-gray-600">
                      Upload 1-4 photos
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Sparkles className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      AI Preview
                    </h3>
                    <p className="text-xs text-gray-600">
                      Realistic lighting effects
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Instant Estimate
                    </h3>
                    <p className="text-xs text-gray-600">
                      Auto-calculated pricing
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Save className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Save to CRM
                    </h3>
                    <p className="text-xs text-gray-600">
                      Link to customer project
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Editor State */
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-3 gap-6"
              >
                {/* Left Column: Controls */}
                <div className="space-y-4">
                  {/* Photo Thumbnails */}
                  {photos.length > 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Uploaded Views</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {photos.map((photo, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                              activePhotoIndex === idx
                                ? 'border-blue-500 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt={photo.angle}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs py-1 px-2">
                              {photo.angle}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePhoto(idx);
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <LightingStyleSelector
                    selectedStyle={selectedStyle}
                    onSelectStyle={setSelectedStyle}
                    intensity={intensity}
                    onIntensityChange={setIntensity}
                  />

                  {/* Auto-Detection Toggle */}
                  {rooflineData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900 text-sm">Auto-Detection Active</span>
                      </div>
                      <div className="text-xs text-blue-800 space-y-1">
                        <div>✓ Roofline detected at {rooflineData.rooflineY}px</div>
                        <div>✓ {rooflineData.suggestedFixtureCount} fixtures recommended</div>
                        <div>✓ House width: ~{costEstimate?.estimatedWidthFeet}ft</div>
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Generate Preview
                      </>
                    )}
                  </button>

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-900">
                          {processingStatus}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${processingProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={handleDownload}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Download Current View
                      </button>

                      {photos.length > 1 && (
                        <button
                          onClick={handleDownloadAll}
                          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download All ({photos.length})
                        </button>
                      )}

                      <button
                        onClick={handleSaveToProject}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Save className="w-5 h-5" />
                        Save to Project
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleEmailCustomer}
                          className="py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          PDF Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Preview + Cost */}
                <div className="col-span-2 space-y-4">
                  {/* Preview */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{ height: '500px' }}>
                    {activeGenerated ? (
                      <BeforeAfterSlider
                        beforeImage={activePhoto.url}
                        afterImage={activeGenerated.url}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <img
                          src={activePhoto.url}
                          alt="House"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <div className="text-center bg-white rounded-lg p-6 shadow-xl">
                            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium mb-2">
                              {activePhoto.angle} View Ready
                            </p>
                            <p className="text-sm text-gray-500">
                              Customize settings and click "Generate Preview"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Estimate */}
                  {showCostBreakdown && costEstimate && (
                    <CostEstimateDisplay
                      costData={costEstimate}
                      rooflineData={rooflineData}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
