import React from 'react';
import { Camera, Check, Circle } from 'lucide-react';

/**
 * Capture Guide Component
 * Provides visual guidance for capturing required photos
 */
export default function CaptureGuide({ requiredPhotos, currentStep, onClose }) {
  const currentPhoto = requiredPhotos[currentStep];
  const completedCount = requiredPhotos.filter((p) => p.captured).length;
  const progress = (completedCount / requiredPhotos.length) * 100;

  return (
    <div className="capture-guide bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-800">Photo Capture Guide</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {completedCount} of {requiredPhotos.length} photos captured
        </p>
      </div>

      {/* Current Photo Instructions */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Camera className="w-12 h-12 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              Step {currentStep + 1}: {currentPhoto?.name}
            </h4>
            <div className="space-y-2 text-gray-600">
              {currentPhoto?.angle === 'front-left' && (
                <>
                  <p>• Position yourself at the front-left corner of the house</p>
                  <p>• Capture the front and left side in one photo</p>
                  <p>• Include as much of the roof as possible</p>
                  <p>• Make sure the image is well-lit and in focus</p>
                </>
              )}
              {currentPhoto?.angle === 'front-right' && (
                <>
                  <p>• Position yourself at the front-right corner of the house</p>
                  <p>• Capture the front and right side in one photo</p>
                  <p>• Include the roof line and chimney if visible</p>
                  <p>• Ensure good lighting and clarity</p>
                </>
              )}
              {currentPhoto?.angle === 'left-side' && (
                <>
                  <p>• Stand perpendicular to the left side of the house</p>
                  <p>• Capture the entire left elevation</p>
                  <p>• Include roof, walls, and foundation</p>
                  <p>• Keep the camera level</p>
                </>
              )}
              {currentPhoto?.angle === 'right-side' && (
                <>
                  <p>• Stand perpendicular to the right side of the house</p>
                  <p>• Capture the entire right elevation</p>
                  <p>• Include all architectural features</p>
                  <p>• Maintain a straight, level shot</p>
                </>
              )}
              {currentPhoto?.angle === 'back-left' && (
                <>
                  <p>• Position yourself at the back-left corner</p>
                  <p>• Capture the back and left side</p>
                  <p>• Include any rear additions or decks</p>
                  <p>• Get a clear view of the back roof</p>
                </>
              )}
              {currentPhoto?.angle === 'back-right' && (
                <>
                  <p>• Position yourself at the back-right corner</p>
                  <p>• Capture the back and right side</p>
                  <p>• Include outdoor structures</p>
                  <p>• Ensure complete roof coverage</p>
                </>
              )}
              {currentPhoto?.angle === 'overhead' && (
                <>
                  <p>• Use a drone or elevated position if available</p>
                  <p>• Capture the entire roof from above</p>
                  <p>• Get a bird's-eye view of the property</p>
                  <p>• Include all roof surfaces</p>
                </>
              )}
              {currentPhoto?.angle === 'detail' && (
                <>
                  <p>• Get close to the roof edge or accessible area</p>
                  <p>• Capture detailed shots of shingles and vents</p>
                  <p>• Show texture and current condition</p>
                  <p>• Multiple detail shots are helpful</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Visual Diagram */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-center">
            <svg className="w-full max-w-md mx-auto" viewBox="0 0 400 300">
              {/* House outline */}
              <polygon
                points="200,50 350,150 350,250 50,250 50,150"
                fill="#e5e7eb"
                stroke="#374151"
                strokeWidth="2"
              />

              {/* Highlight current angle */}
              {currentPhoto?.angle === 'front-left' && (
                <circle cx="50" cy="200" r="20" fill="#3b82f6" opacity="0.5" />
              )}
              {currentPhoto?.angle === 'front-right' && (
                <circle cx="350" cy="200" r="20" fill="#3b82f6" opacity="0.5" />
              )}
              {currentPhoto?.angle === 'overhead' && (
                <circle cx="200" cy="150" r="20" fill="#3b82f6" opacity="0.5" />
              )}

              {/* Camera icon at position */}
              <text x="200" y="20" fontSize="24" textAnchor="middle">📷</text>
            </svg>
            <p className="text-sm text-gray-600 mt-2">
              Capture from the highlighted position
            </p>
          </div>
        </div>
      </div>

      {/* Photo Checklist */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Photo Checklist</h4>
        <div className="grid grid-cols-2 gap-2">
          {requiredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={`flex items-center gap-2 p-2 rounded ${
                photo.captured
                  ? 'bg-green-50 text-green-800'
                  : index === currentStep
                  ? 'bg-blue-50 text-blue-800'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {photo.captured ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : index === currentStep ? (
                <Camera className="w-4 h-4 text-blue-600" />
              ) : (
                <Circle className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-medium">{photo.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-yellow-50 border-t border-yellow-100">
        <h4 className="text-sm font-semibold text-yellow-800 mb-2">💡 Pro Tips</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Use a wide-angle lens or step back for full coverage</li>
          <li>• Take photos during daylight hours for best results</li>
          <li>• Avoid shadows and harsh lighting conditions</li>
          <li>• Hold your camera/phone steady or use a tripod</li>
          <li>• Take multiple shots from each angle if unsure</li>
        </ul>
      </div>
    </div>
  );
}
