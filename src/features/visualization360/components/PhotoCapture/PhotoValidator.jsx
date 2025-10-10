import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Info } from 'lucide-react';
import { validateImage, detectBlur, detectBrightness } from '../../utils/ImageProcessor';

/**
 * Photo Validator Component - Enhanced for High-Quality Professional Photos
 * Supports up to 50MB, RAW formats, and advanced quality detection
 */
export default function PhotoValidator({ file, onValidationComplete }) {
  const [validation, setValidation] = useState({
    isValidating: true,
    dimensions: null,
    quality: null,
    brightness: null,
    fileFormat: null,
    errors: [],
    warnings: [],
    info: [],
  });

  // Supported formats with max size
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const SUPPORTED_FORMATS = {
    standard: ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'],
    raw: ['image/x-canon-cr2', 'image/x-nikon-nef', 'image/x-sony-arw', 'image/x-adobe-dng'],
  };

  const performValidation = useCallback(async (imageFile) => {
    const errors = [];
    const warnings = [];
    const info = [];

    try {
      // Check file size (50MB max)
      if (imageFile.size > MAX_FILE_SIZE) {
        errors.push(`File size (${(imageFile.size / 1024 / 1024).toFixed(2)}MB) exceeds 50MB limit. Please compress or use a smaller image.`);
        setValidation({
          isValidating: false,
          dimensions: null,
          quality: null,
          brightness: null,
          fileFormat: imageFile.type,
          errors,
          warnings,
          info,
        });
        onValidationComplete({ valid: false, errors, warnings, info });
        return;
      }

      // Detect file format
      const fileType = imageFile.type.toLowerCase();
      const fileName = imageFile.name.toLowerCase();
      const isRawFormat = SUPPORTED_FORMATS.raw.includes(fileType) ||
                          fileName.endsWith('.cr2') ||
                          fileName.endsWith('.nef') ||
                          fileName.endsWith('.arw') ||
                          fileName.endsWith('.dng');

      if (isRawFormat) {
        info.push('RAW format detected. Image will be processed with maximum quality preservation.');
      }

      // Validate basic image properties
      const imageData = await validateImage(imageFile);

      // Check dimensions for optimal quality
      if (imageData.width < 1920 || imageData.height < 1080) {
        warnings.push('Image resolution is below Full HD (1920x1080). For best results, use 4K (3840x2160) or higher.');
      } else if (imageData.width >= 3840 && imageData.height >= 2160) {
        info.push('✓ Excellent! 4K+ resolution detected for photorealistic rendering.');
      } else if (imageData.width >= 1920 && imageData.height >= 1080) {
        info.push('✓ Good quality Full HD resolution.');
      }

      // File size recommendations
      if (imageFile.size < 1 * 1024 * 1024) { // Less than 1MB
        warnings.push('File size is quite small. Higher quality images produce better visualization results.');
      } else if (imageFile.size > 20 * 1024 * 1024) { // Over 20MB
        info.push('Large file detected. Processing may take a moment for optimal quality.');
      }

      // Load image for advanced validation
      const img = new Image();
      const url = URL.createObjectURL(imageFile);

      img.onload = async () => {
        URL.revokeObjectURL(url);

        // Check for blur
        const blurResult = await detectBlur(img);
        if (blurResult.isBlurry) {
          warnings.push('Image appears to be slightly blurry. Consider retaking for best results.');
        }

        // Check brightness
        const brightnessResult = await detectBrightness(img);
        if (brightnessResult.quality === 'too-dark') {
          warnings.push('Image is too dark. Try taking the photo in better lighting.');
        } else if (brightnessResult.quality === 'too-bright') {
          warnings.push('Image is overexposed. Reduce brightness or avoid direct sunlight.');
        }

        setValidation({
          isValidating: false,
          dimensions: imageData,
          quality: blurResult.quality,
          brightness: brightnessResult.quality,
          fileFormat: imageFile.type,
          errors,
          warnings,
          info,
        });

        onValidationComplete({
          valid: errors.length === 0,
          errors,
          warnings,
          info,
          imageData,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        errors.push('Failed to load image. File may be corrupted or in an unsupported format.');
        setValidation({
          isValidating: false,
          dimensions: null,
          quality: null,
          brightness: null,
          fileFormat: imageFile.type,
          errors,
          warnings,
          info,
        });
        onValidationComplete({ valid: false, errors, warnings, info });
      };

      img.src = url;
    } catch (error) {
      errors.push(error.message);
      setValidation({
        isValidating: false,
        dimensions: null,
        quality: null,
        brightness: null,
        fileFormat: null,
        errors,
        warnings,
        info,
      });
      onValidationComplete({ valid: false, errors, warnings, info });
    }
  }, [MAX_FILE_SIZE, onValidationComplete]);

  useEffect(() => {
    if (file) {
      performValidation(file);
    }
  }, [file, performValidation]);

  if (validation.isValidating) {
    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        <div className="flex-1">
          <span className="text-sm font-medium text-blue-900">Analyzing image quality...</span>
          <p className="text-xs text-blue-700 mt-1">Checking resolution, format, brightness, and sharpness</p>
        </div>
      </div>
    );
  }

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const hasInfo = validation.info.length > 0;
  const isValid = !hasErrors;

  return (
    <div className="space-y-3">
      {/* Validation Status */}
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border-2 ${
          isValid
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}
      >
        {isValid ? (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`text-base font-semibold ${isValid ? 'text-green-900' : 'text-red-900'}`}>
            {isValid ? '✓ Image Ready for Professional Visualization' : '✗ Image Quality Issues Detected'}
          </p>
          {validation.dimensions && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-700 font-medium">
                {validation.dimensions.width} × {validation.dimensions.height} pixels
                {validation.dimensions.width >= 3840 && validation.dimensions.height >= 2160 && (
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">4K Quality</span>
                )}
              </p>
              <p className="text-xs text-gray-600">
                File Size: {(validation.dimensions.size / 1024 / 1024).toFixed(2)} MB / 50 MB max •{' '}
                Format: {validation.fileFormat || 'Unknown'} •{' '}
                Sharpness: {validation.quality || 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Messages */}
      {hasInfo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-900">Quality Information</p>
          </div>
          <ul className="space-y-1.5">
            {validation.info.map((info, index) => (
              <li key={index} className="text-xs text-blue-800 flex items-start gap-2 pl-6">
                <span className="text-blue-500">→</span>
                <span>{info}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-semibold text-red-900">Critical Errors</p>
          </div>
          <ul className="space-y-1.5">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-xs text-red-800 flex items-start gap-2 pl-6">
                <span className="text-red-600 font-bold">✕</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-semibold text-yellow-900">Recommendations</p>
          </div>
          <ul className="space-y-1.5">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-xs text-yellow-800 flex items-start gap-2 pl-6">
                <span className="text-yellow-600">⚠</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Professional Tips */}
      {isValid && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-indigo-900 mb-1.5">💡 Pro Tips for Best Results:</p>
          <ul className="space-y-1 text-xs text-indigo-800">
            <li>• Take photos in natural daylight for accurate colors</li>
            <li>• Capture straight-on views of the property</li>
            <li>• Include full roof and eaves in frame for lighting design</li>
            <li>• Use 4K+ resolution for photorealistic visualization</li>
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {isValid ? (
          <button
            onClick={() => onValidationComplete({ valid: true, ...validation })}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Use This Image
          </button>
        ) : (
          <button
            onClick={() => onValidationComplete({ valid: false, cancelled: true })}
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Choose Different Image
          </button>
        )}

        {hasWarnings && isValid && (
          <button
            onClick={() => onValidationComplete({ valid: false, cancelled: true })}
            className="py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
