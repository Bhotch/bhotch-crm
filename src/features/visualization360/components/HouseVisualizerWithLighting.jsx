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
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import {
  generateLightingVisualization,
  getLightingStyles,
  getAIProviders
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
 * Photo Upload Zone Component
 */
const PhotoUploadZone = ({ onUpload, isProcessing }) => {
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

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    try {
      const validation = await validateImage(file);
      onUpload(file, validation);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isProcessing}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Upload className="w-10 h-10 text-gray-400" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload House Photo
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop or click to select
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            Choose Photo
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Supports JPG, PNG • Min 800x600 • Max 10MB
        </p>
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
        <Palette className="w-4 h-4" />
        Lighting Style
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(styles).map(([key, style]) => (
          <button
            key={key}
            onClick={() => onSelectStyle(key)}
            className={`p-3 rounded-lg border-2 transition text-left ${
              selectedStyle === key
                ? 'border-blue-500 bg-blue-50'
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
          <span>Brightness</span>
          <span className="text-blue-600">{intensity}%</span>
        </label>
        <input
          type="range"
          min="20"
          max="100"
          value={intensity}
          onChange={(e) => onIntensityChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>
  );
};

/**
 * Main House Visualizer Component
 */
export default function HouseVisualizerWithLighting() {
  const [originalImage, setOriginalImage] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState('warmWhite');
  const [intensity, setIntensity] = useState(80);
  const [error, setError] = useState(null);

  const handleUpload = useCallback((file, validation) => {
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setOriginalFile(file);
    setGeneratedImage(null);
    setPreviewImage(null);
    setError(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!originalFile) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      const result = await generateLightingVisualization(
        originalFile,
        selectedStyle,
        intensity,
        {
          preferredProvider: getAIProviders().CANVAS_FALLBACK, // Start with canvas, can upgrade to AI later
          onProgress: (progress) => {
            setProcessingStatus(progress.status);
            setProcessingProgress(progress.progress);

            if (progress.previewUrl) {
              setPreviewImage(progress.previewUrl);
            }
          }
        }
      );

      setGeneratedImage(result.final.url);

      if (result.error) {
        setError(`Note: ${result.error}. Showing preview version.`);
      }
    } catch (err) {
      setError(`Failed to generate visualization: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
      setProcessingProgress(0);
    }
  }, [originalFile, selectedStyle, intensity]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `rime-lighting-preview-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [generatedImage]);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setOriginalFile(null);
    setGeneratedImage(null);
    setPreviewImage(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Rime Lighting Visualizer
              </h1>
              <p className="text-sm text-gray-600">
                Upload a house photo and preview with permanent eave lighting
              </p>
            </div>
          </div>

          {originalImage && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100%-80px)] overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {!originalImage ? (
              /* Upload State */
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <PhotoUploadZone
                  onUpload={handleUpload}
                  isProcessing={isProcessing}
                />

                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      1. Upload Photo
                    </h3>
                    <p className="text-xs text-gray-600">
                      Front view of house
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Sliders className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      2. Customize
                    </h3>
                    <p className="text-xs text-gray-600">
                      Choose colors & brightness
                    </p>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                    <Sparkles className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      3. Preview
                    </h3>
                    <p className="text-xs text-gray-600">
                      See before/after results
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
                className="grid grid-cols-3 gap-6 h-full"
              >
                {/* Left: Controls */}
                <div className="space-y-4">
                  <LightingStyleSelector
                    selectedStyle={selectedStyle}
                    onSelectStyle={setSelectedStyle}
                    intensity={intensity}
                    onIntensityChange={setIntensity}
                  />

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isProcessing}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
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
                          {processingStatus.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">{error}</p>
                    </div>
                  )}

                  {/* Download Button */}
                  {generatedImage && (
                    <button
                      onClick={handleDownload}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download Result
                    </button>
                  )}

                  {/* Info Box */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      How It Works
                    </h3>
                    <ul className="text-xs text-gray-600 space-y-2">
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>AI-powered visualization shows realistic lighting effects</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Choose from warm white, cool white, or colorful RGB options</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Adjust brightness to match your preferences</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Download and share your visualization</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Right: Preview (2 columns) */}
                <div className="col-span-2">
                  {generatedImage ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                      <BeforeAfterSlider
                        beforeImage={originalImage}
                        afterImage={generatedImage}
                        className="w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full">
                      <img
                        src={previewImage || originalImage}
                        alt="House"
                        className="w-full h-full object-contain"
                      />
                      {!previewImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                          <div className="text-center">
                            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 font-medium">
                              Customize settings and click "Generate Preview"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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
