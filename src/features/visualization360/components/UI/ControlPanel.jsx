import React, { useRef, useState } from 'react';
import { useVisualizationStore } from '../../store/visualizationStore';
import { Upload, Eye, EyeOff, Camera, Download, RefreshCw } from 'lucide-react';
import { compressImage } from '../../utils/ImageProcessor';
import PhotoValidator from '../PhotoCapture/PhotoValidator';

/**
 * Control Panel Component
 * Main control interface for the visualization tool
 */
export default function ControlPanel() {
  const fileInputRef = useRef();
  const [uploadingFile, setUploadingFile] = useState(null);
  const [showValidator, setShowValidator] = useState(false);

  const {
    images,
    viewMode,
    setBeforeImage,
    setViewMode,
    ui,
    setLoading,
    resetAll,
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

      {/* Quick Actions */}
      {images.before && (
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">Quick Actions</h4>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Trigger export functionality
                alert('Export functionality - Coming soon!');
              }}
              className="w-full py-2 px-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Image
            </button>
            <button
              onClick={() => {
                // Trigger photo capture mode
                alert('Photo capture mode - Coming soon!');
              }}
              className="w-full py-2 px-3 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              8-Photo Capture
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          <strong>How to use:</strong>
        </p>
        <ul className="text-xs text-gray-600 mt-2 space-y-1 pl-4">
          <li>• Upload a house photo to begin</li>
          <li>• Select products from the tabs</li>
          <li>• Apply shingles and lighting</li>
          <li>• Compare before/after views</li>
          <li>• Export final visualization</li>
        </ul>
      </div>
    </div>
  );
}
