import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { validateImage, detectBlur, detectBrightness } from '../../utils/ImageProcessor';

/**
 * Photo Validator Component
 * Validates uploaded photos for quality and suitability
 */
export default function PhotoValidator({ file, onValidationComplete }) {
  const [validation, setValidation] = useState({
    isValidating: true,
    dimensions: null,
    quality: null,
    brightness: null,
    errors: [],
    warnings: [],
  });

  useEffect(() => {
    if (file) {
      performValidation(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const performValidation = async (imageFile) => {
    const errors = [];
    const warnings = [];

    try {
      // Validate basic image properties
      const imageData = await validateImage(imageFile);

      // Check dimensions
      if (imageData.width < 1200) {
        warnings.push('Image resolution is low. Higher resolution recommended for better results.');
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
          errors,
          warnings,
        });

        onValidationComplete({
          valid: errors.length === 0,
          errors,
          warnings,
          imageData,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        errors.push('Failed to load image. File may be corrupted.');
        setValidation({
          isValidating: false,
          dimensions: null,
          quality: null,
          brightness: null,
          errors,
          warnings,
        });
        onValidationComplete({ valid: false, errors, warnings });
      };

      img.src = url;
    } catch (error) {
      errors.push(error.message);
      setValidation({
        isValidating: false,
        dimensions: null,
        quality: null,
        brightness: null,
        errors,
        warnings,
      });
      onValidationComplete({ valid: false, errors, warnings });
    }
  };

  if (validation.isValidating) {
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        <span className="text-sm text-blue-800">Validating image quality...</span>
      </div>
    );
  }

  const hasErrors = validation.errors.length > 0;
  const hasWarnings = validation.warnings.length > 0;
  const isValid = !hasErrors;

  return (
    <div className="space-y-2">
      {/* Validation Status */}
      <div
        className={`flex items-start gap-2 p-3 rounded-lg ${
          isValid
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}
      >
        {isValid ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`text-sm font-medium ${isValid ? 'text-green-800' : 'text-red-800'}`}>
            {isValid ? 'Image looks good!' : 'Image has quality issues'}
          </p>
          {validation.dimensions && (
            <p className="text-xs text-gray-600 mt-1">
              {validation.dimensions.width} × {validation.dimensions.height} pixels •{' '}
              {(validation.dimensions.size / 1024 / 1024).toFixed(2)} MB •{' '}
              Quality: {validation.quality}
            </p>
          )}
        </div>
      </div>

      {/* Errors */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
          <ul className="space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-xs text-red-700 flex items-start gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {hasWarnings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm font-medium text-yellow-800 mb-2">Warnings:</p>
          <ul className="space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-xs text-yellow-700 flex items-start gap-2">
                <span>•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
