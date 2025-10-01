import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, Circle, RotateCcw, Download, Info } from 'lucide-react';
import { useVisualizationStore } from '../../store/visualizationStore';

/**
 * Camera Integration Component
 * 8-photo capture workflow for photogrammetry
 * Phase 2 Feature
 */

export default function CameraIntegration({ onComplete, className = '' }) {
  const [cameraActive, setCameraActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const { photoCapture, addCapturedImage } = useVisualizationStore();

  // Required photo angles with guidance
  const captureSteps = [
    {
      id: 1,
      name: 'Front Left Corner',
      angle: 'front-left',
      instruction: 'Stand at the front left corner of the house. Capture the front and left side.',
      tips: 'Include both the front facade and left side wall in frame'
    },
    {
      id: 2,
      name: 'Front Right Corner',
      angle: 'front-right',
      instruction: 'Move to the front right corner. Capture the front and right side.',
      tips: 'Overlap slightly with the previous photo'
    },
    {
      id: 3,
      name: 'Left Side Elevation',
      angle: 'left-side',
      instruction: 'Position yourself to capture the full left side of the house.',
      tips: 'Keep the camera level and capture the entire roof line'
    },
    {
      id: 4,
      name: 'Right Side Elevation',
      angle: 'right-side',
      instruction: 'Move to capture the full right side of the house.',
      tips: 'Maintain consistent distance from previous photos'
    },
    {
      id: 5,
      name: 'Back Left Corner',
      angle: 'back-left',
      instruction: 'Position at the back left corner to capture rear and left side.',
      tips: 'Include chimney, vents, and other roof features'
    },
    {
      id: 6,
      name: 'Back Right Corner',
      angle: 'back-right',
      instruction: 'Move to the back right corner to complete the perimeter.',
      tips: 'Ensure good overlap with previous photos'
    },
    {
      id: 7,
      name: 'Overhead/Drone View',
      angle: 'overhead',
      instruction: 'Capture from elevated position (ladder, drone, or 2nd story window).',
      tips: 'This is crucial for roof detail. Use a drone if available.'
    },
    {
      id: 8,
      name: 'Roof Detail Close-up',
      angle: 'detail',
      instruction: 'Close-up of roof surface showing shingle texture and condition.',
      tips: 'Focus on shingle detail, valleys, and flashing'
    }
  ];

  /**
   * Start camera
   */
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setCameraActive(true);
      setCameraError(null);
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Unable to access camera. Please grant camera permissions.');
    }
  };

  /**
   * Stop camera
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  /**
   * Capture photo
   */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Get image data
    canvas.toBlob(async (blob) => {
      const photoData = {
        id: Date.now(),
        angle: captureSteps[currentStep].angle,
        name: captureSteps[currentStep].name,
        blob,
        preview: URL.createObjectURL(blob),
        timestamp: new Date().toISOString(),
        gps: await getGPSLocation(),
        orientation: getDeviceOrientation(),
        file: new File([blob], `photo-${currentStep + 1}.jpg`, { type: 'image/jpeg' })
      };

      // Add to captured photos
      const updated = [...capturedPhotos];
      updated[currentStep] = photoData;
      setCapturedPhotos(updated);

      // Add to store
      addCapturedImage(photoData);

      // Show preview
      setPreviewUrl(photoData.preview);

      // Auto-advance after short delay
      setTimeout(() => {
        setPreviewUrl(null);
        if (currentStep < captureSteps.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          // All photos captured
          stopCamera();
          if (onComplete) {
            onComplete(updated);
          }
        }
      }, 2000);
    }, 'image/jpeg', 0.95);
  };

  /**
   * Get GPS location (if available)
   */
  const getGPSLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => resolve(null),
        { timeout: 5000 }
      );
    });
  };

  /**
   * Get device orientation
   */
  const getDeviceOrientation = () => {
    if (window.screen?.orientation) {
      return window.screen.orientation.type;
    }
    return 'unknown';
  };

  /**
   * Retake current photo
   */
  const retakePhoto = () => {
    setPreviewUrl(null);
    const updated = [...capturedPhotos];
    updated[currentStep] = null;
    setCapturedPhotos(updated);
  };

  /**
   * Go to specific step
   */
  const goToStep = (stepIndex) => {
    setCurrentStep(stepIndex);
    setPreviewUrl(null);
  };

  /**
   * Toggle camera facing mode (front/back)
   */
  const toggleCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setTimeout(() => startCamera(), 100);
  };

  /**
   * Upload existing photos instead of capturing
   */
  const handleFileUpload = (event, stepIndex) => {
    const file = event.target.files[0];
    if (!file) return;

    const photoData = {
      id: Date.now(),
      angle: captureSteps[stepIndex].angle,
      name: captureSteps[stepIndex].name,
      blob: file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
      gps: null,
      orientation: 'unknown',
      file
    };

    const updated = [...capturedPhotos];
    updated[stepIndex] = photoData;
    setCapturedPhotos(updated);
    addCapturedImage(photoData);
  };

  /**
   * Export all photos
   */
  const exportPhotos = () => {
    capturedPhotos.forEach((photo, idx) => {
      if (!photo) return;

      const a = document.createElement('a');
      a.href = photo.preview;
      a.download = `${photo.angle}-${idx + 1}.jpg`;
      a.click();
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      capturedPhotos.forEach(photo => {
        if (photo?.preview) {
          URL.revokeObjectURL(photo.preview);
        }
      });
    };
  }, []);

  const progress = (capturedPhotos.filter(p => p).length / captureSteps.length) * 100;

  return (
    <div className={`camera-integration bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6" />
            <h3 className="text-lg font-bold">8-Photo Capture</h3>
          </div>
          <div className="text-sm font-medium">
            {capturedPhotos.filter(p => p).length} / {captureSteps.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-blue-800 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-4">
        {/* Camera Error */}
        {cameraError && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <p className="text-sm text-red-800">{cameraError}</p>
          </div>
        )}

        {/* Current Step Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">
                {captureSteps[currentStep].name}
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                {captureSteps[currentStep].instruction}
              </p>
              <p className="text-xs text-blue-700">
                💡 {captureSteps[currentStep].tips}
              </p>
            </div>
          </div>
        </div>

        {/* Camera View */}
        {cameraActive && !previewUrl && (
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto"
            />

            {/* Camera Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <button
                onClick={toggleCamera}
                className="p-3 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full"
                title="Switch Camera"
              >
                <RotateCcw className="w-5 h-5 text-gray-800" />
              </button>

              <button
                onClick={capturePhoto}
                className="p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
                title="Capture Photo"
              >
                <Camera className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="relative mb-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />

            <div className="absolute top-4 right-4">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            <button
              onClick={retakePhoto}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-lg font-medium"
            >
              Retake
            </button>
          </div>
        )}

        {/* Start Camera Button */}
        {!cameraActive && !previewUrl && (
          <button
            onClick={startCamera}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 mb-4"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </button>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {captureSteps.map((step, idx) => {
            const photo = capturedPhotos[idx];
            const isCurrent = idx === currentStep;

            return (
              <div
                key={step.id}
                className={`relative aspect-square rounded border-2 ${
                  isCurrent ? 'border-blue-500' : photo ? 'border-green-500' : 'border-gray-300'
                } cursor-pointer hover:border-blue-400 transition-colors`}
                onClick={() => goToStep(idx)}
              >
                {photo ? (
                  <img
                    src={photo.preview}
                    alt={step.name}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Circle className="w-6 h-6 text-gray-400" />
                  </div>
                )}

                {photo && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 text-center">
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Alternative */}
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 mb-2">Or upload existing photos:</p>

          <label className="block w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded border border-gray-300 text-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, currentStep)}
              className="hidden"
            />
            Upload Photo {currentStep + 1}
          </label>
        </div>

        {/* Actions */}
        {capturedPhotos.filter(p => p).length === captureSteps.length && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={exportPhotos}
              className="flex-1 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>

            <button
              onClick={() => onComplete && onComplete(capturedPhotos)}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              Process Photos
            </button>
          </div>
        )}
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
