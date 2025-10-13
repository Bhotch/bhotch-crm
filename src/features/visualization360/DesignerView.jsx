import React, { useState, useRef } from 'react';
import {
  Home, Layers, Palette, Image, Upload, Download, Share2,
  ZoomIn, ZoomOut, RotateCcw, Grid, Eye, EyeOff,
  ChevronLeft, ChevronRight, Check,
  Plus, Move, Lock, Unlock, Loader2
} from 'lucide-react';
import { compressImage } from './utils/ImageProcessor';
import { ai3DModelGenerator } from './services/AI3DModelGenerator';

/**
 * DesignerView - Modern property design interface inspired by hover.to/designer
 * Professional visualization and design tool for roofing projects
 */
export default function DesignerView() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState('roof');
  const [selectedColor, setSelectedColor] = useState('#334155');
  const [selectedMaterial, setSelectedMaterial] = useState('asphalt-shingle');
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [model3D, setModel3D] = useState(null);
  const [appliedShingleColor, setAppliedShingleColor] = useState(null);
  const [appliedLighting, setAppliedLighting] = useState(null);
  const [lightingIntensity, setLightingIntensity] = useState(80);
  const [isApplying, setIsApplying] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const compositeCanvasRef = useRef(null);

  // Sample property data
  const properties = [
    { id: 1, name: '123 Main St', image: null, thumbnail: null },
    { id: 2, name: '456 Oak Ave', image: null, thumbnail: null },
    { id: 3, name: '789 Pine Rd', image: null, thumbnail: null },
  ];

  // Design layers - Only Roof (Malarkey Vista) and Lighting (Rime)
  const layers = [
    { id: 'roof', name: 'Malarkey Vista Shingles', icon: Home, visible: true, locked: false },
    { id: 'lighting', name: 'Rime Lighting', icon: Palette, visible: true, locked: false },
  ];

  // Malarkey Vista Shingle Colors - 8 Official Colors
  const malarkeyVistaColors = [
    {
      id: 'weathered-wood',
      name: 'Weathered Wood',
      color: '#8B7355',
      hex: '#8B7355',
      description: 'Warm brown with natural wood tones'
    },
    {
      id: 'midnight-black',
      name: 'Midnight Black',
      color: '#2C2C2C',
      hex: '#2C2C2C',
      description: 'Deep, rich black with subtle texture'
    },
    {
      id: 'antique-silver',
      name: 'Antique Silver',
      color: '#A8A8A8',
      hex: '#A8A8A8',
      description: 'Classic gray with silver highlights'
    },
    {
      id: 'slate',
      name: 'Slate',
      color: '#4A5568',
      hex: '#4A5568',
      description: 'Natural slate gray'
    },
    {
      id: 'burnt-sienna',
      name: 'Burnt Sienna',
      color: '#A0522D',
      hex: '#A0522D',
      description: 'Rich terracotta brown'
    },
    {
      id: 'storm-cloud',
      name: 'Storm Cloud',
      color: '#6B7280',
      hex: '#6B7280',
      description: 'Medium gray with depth'
    },
    {
      id: 'natural-wood',
      name: 'Natural Wood',
      color: '#C19A6B',
      hex: '#C19A6B',
      description: 'Light tan with warm undertones'
    },
    {
      id: 'shadow-black',
      name: 'Shadow Black',
      color: '#1A1A1A',
      hex: '#1A1A1A',
      description: 'Premium black with dimensional shading'
    },
  ];

  // Rime Lighting Colors
  const rimeLightingColors = [
    { id: 'warm-white', name: 'Warm White', color: '#FFF8DC', rgb: '255, 248, 220' },
    { id: 'pure-white', name: 'Pure White', color: '#FFFFFF', rgb: '255, 255, 255' },
    { id: 'ice-blue', name: 'Ice Blue', color: '#ADD8E6', rgb: '173, 216, 230' },
    { id: 'rgb-multicolor', name: 'RGB Multicolor', color: 'linear-gradient(90deg, #FF0000, #00FF00, #0000FF)', rgb: 'Multi' },
  ];

  // Apply shingle color to house
  const applyShingleColor = async (shingleColor) => {
    if (!uploadedImage) {
      alert('Please upload a house image first!');
      return;
    }

    setIsApplying(true);
    setSelectedLayer('roof');

    try {
      // Simulate AI processing (in production, this would call an AI service)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAppliedShingleColor(shingleColor);
      alert(`✅ ${shingleColor.name} shingles applied successfully!`);
    } catch (error) {
      console.error('Failed to apply shingles:', error);
      alert('Failed to apply shingles. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // Apply Rime lighting to house
  const applyLighting = async (lightingColor) => {
    if (!uploadedImage) {
      alert('Please upload a house image first!');
      return;
    }

    setIsApplying(true);
    setSelectedLayer('lighting');

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 800));

      setAppliedLighting(lightingColor);
      alert(`✅ Rime Lighting (${lightingColor.name}) applied successfully!`);
    } catch (error) {
      console.error('Failed to apply lighting:', error);
      alert('Failed to apply lighting. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // Remove applied layers
  const removeShingles = () => {
    setAppliedShingleColor(null);
  };

  const removeLighting = () => {
    setAppliedLighting(null);
  };

  // Handle image upload (optimized for performance)
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    console.log('Upload triggered, files:', files ? files.length : 0);

    if (!files || files.length === 0) {
      console.warn('No files selected');
      return;
    }

    setIsUploading(true);

    try {
      const photoArray = [];
      const maxFiles = Math.min(files.length, 8);

      // Process images in batches to avoid blocking UI
      const batchSize = 2;
      for (let i = 0; i < maxFiles; i += batchSize) {
        const batch = [];
        const endIndex = Math.min(i + batchSize, maxFiles);

        // Process batch in parallel
        for (let j = i; j < endIndex; j++) {
          batch.push(
            compressImage(files[j], 2048, 0.9).then(compressed => ({
              id: Date.now() + j,
              angle: `photo-${j + 1}`,
              name: files[j].name,
              file: compressed.file,
              preview: compressed.url,
              timestamp: new Date().toISOString()
            }))
          );
        }

        // Wait for batch to complete before next batch
        const batchResults = await Promise.all(batch);
        photoArray.push(...batchResults);

        // Yield to browser between batches for better responsiveness
        if (i + batchSize < maxFiles) {
          await new Promise(resolve => {
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => resolve(), { timeout: 100 });
            } else {
              setTimeout(resolve, 0);
            }
          });
        }
      }

      // Set the first image as uploaded
      setUploadedImage(photoArray[0].preview);

      // If multiple images, generate 3D model
      if (photoArray.length >= 2) {
        console.log(`Generating 3D model from ${photoArray.length} images...`);

        // Defer 3D model generation to not block UI
        requestIdleCallback(async () => {
          try {
            const modelData = await ai3DModelGenerator.generateModel(photoArray, {
              quality: photoArray.length >= 8 ? 'high' : 'medium',
              includeTextures: true,
              optimizeForWeb: true,
            });

            setModel3D(modelData);
            alert(`✅ 3D Model generated!\n\nMethod: ${modelData.method}\nQuality: ${modelData.quality}\n\nImages: ${photoArray.length}`);
          } catch (modelError) {
            console.error('3D model generation error:', modelError);
          }
        }, { timeout: 1000 });

        alert('✅ Images uploaded successfully! 3D model generation in progress...');
      } else {
        alert('✅ Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to process images: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Property Designer</h1>
          <div className="h-6 w-px bg-gray-300"></div>
          <select
            value={selectedProperty?.id || ''}
            onChange={(e) => {
              const property = properties.find(p => p.id === parseInt(e.target.value));
              setSelectedProperty(property);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a property...</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>{property.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium">{zoom}%</span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="p-2 hover:bg-white rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'}`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="photo-upload-input"
            name="photo-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => {
              console.log('Upload button clicked');
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            disabled={isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo{uploadedImage ? ' (Change)' : 's (1-8)'}
              </>
            )}
          </button>

          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export Design
          </button>

          <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" title="Share">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layers & Properties */}
        {showLeftPanel && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Layers</h2>
              <button
                onClick={() => setShowLeftPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {layers.map(layer => {
                const Icon = layer.icon;
                const isSelected = selectedLayer === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span className={`flex-1 font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {layer.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-xs text-gray-600 text-center">
                <p className="font-semibold mb-1">Available Layers</p>
                <p>Malarkey Vista™ Shingles</p>
                <p>Rime Lighting™ System</p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Left Panel Button */}
        {!showLeftPanel && (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-r-lg p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Center Canvas Area */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div
              ref={canvasRef}
              className="bg-white rounded-lg shadow-2xl relative"
              style={{
                width: `${zoom}%`,
                maxWidth: '1200px',
                aspectRatio: '16 / 9',
              }}
            >
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              )}

              {uploadedImage ? (
                <div className="absolute inset-0">
                  {/* Base Image */}
                  <img
                    src={uploadedImage}
                    alt="Uploaded property"
                    className="w-full h-full object-contain"
                  />

                  {/* Shingle Color Overlay */}
                  {appliedShingleColor && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-multiply"
                      style={{
                        backgroundColor: appliedShingleColor.color,
                        opacity: 0.3,
                      }}
                    />
                  )}

                  {/* Lighting Overlay */}
                  {appliedLighting && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Simulated lighting effect around perimeter */}
                      <div
                        className="absolute inset-0"
                        style={{
                          boxShadow: `inset 0 0 ${lightingIntensity}px ${lightingIntensity / 2}px ${appliedLighting.color}`,
                          opacity: lightingIntensity / 150,
                        }}
                      />
                    </div>
                  )}

                  {/* Status Badges */}
                  <div className="absolute top-4 left-4 space-y-2">
                    {model3D && (
                      <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                        ✓ 3D Model Generated
                      </div>
                    )}
                    {appliedShingleColor && (
                      <div className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border-2 border-white"
                          style={{ backgroundColor: appliedShingleColor.color }}
                        />
                        {appliedShingleColor.name}
                      </div>
                    )}
                    {appliedLighting && (
                      <div className="bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border-2 border-white"
                          style={{ backgroundColor: appliedLighting.color }}
                        />
                        Rime Lighting - {appliedLighting.name}
                      </div>
                    )}
                  </div>

                  {/* Processing Overlay */}
                  {isApplying && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="text-gray-800 font-medium">Applying changes...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : !selectedProperty ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Image className="w-20 h-20 mb-4" />
                  <p className="text-lg font-medium">Upload a property image</p>
                  <p className="text-sm mt-2">to start designing</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Upload Photos
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Home className="w-32 h-32 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">{selectedProperty.name}</p>
                  <p className="text-sm text-gray-400 mt-1">Upload a photo to begin design</p>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Rotate Reset">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded transition-colors" title="Move">
              <Move className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Sidebar - Materials & Colors */}
        {showRightPanel && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Materials & Colors</h2>
              <button
                onClick={() => setShowRightPanel(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Malarkey Vista Shingles */}
              {selectedLayer === 'roof' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Malarkey Vista™ Shingles</h3>
                    {appliedShingleColor && (
                      <button
                        onClick={removeShingles}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    Premium designer shingles with exceptional durability and style
                  </p>
                  <div className="space-y-2">
                    {malarkeyVistaColors.map(shingle => (
                      <div
                        key={shingle.id}
                        onClick={() => applyShingleColor(shingle)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                          appliedShingleColor?.id === shingle.id
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                          style={{ backgroundColor: shingle.color }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900">{shingle.name}</div>
                          <div className="text-xs text-gray-500">{shingle.description}</div>
                        </div>
                        {appliedShingleColor?.id === shingle.id && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rime Lighting */}
              {selectedLayer === 'lighting' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">Rime Lighting™</h3>
                    {appliedLighting && (
                      <button
                        onClick={removeLighting}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-4">
                    Permanent LED lighting that enhances your home's beauty year-round
                  </p>

                  {/* Lighting Colors */}
                  <div className="space-y-2 mb-4">
                    {rimeLightingColors.map(light => (
                      <div
                        key={light.id}
                        onClick={() => applyLighting(light)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                          appliedLighting?.id === light.id
                            ? 'bg-blue-50 border-blue-500 shadow-md'
                            : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                          style={{
                            background: light.id === 'rgb-multicolor'
                              ? light.color
                              : light.color
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-900">{light.name}</div>
                          <div className="text-xs text-gray-500">RGB: {light.rgb}</div>
                        </div>
                        {appliedLighting?.id === light.id && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Lighting Intensity Slider */}
                  {appliedLighting && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Brightness: {lightingIntensity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={lightingIntensity}
                        onChange={(e) => setLightingIntensity(parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Dim</span>
                        <span>Bright</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              {/* Status Display */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg text-xs">
                <div className="font-semibold text-gray-700 mb-2">Applied Layers:</div>
                <div className="space-y-1">
                  {appliedShingleColor ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: appliedShingleColor.color }}
                      />
                      <span>{appliedShingleColor.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">No shingles applied</div>
                  )}
                  {appliedLighting ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: appliedLighting.color }}
                      />
                      <span>Rime Lighting - {appliedLighting.name}</span>
                    </div>
                  ) : (
                    <div className="text-gray-500">No lighting applied</div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {(appliedShingleColor || appliedLighting) && (
                <button
                  onClick={() => {
                    removeShingles();
                    removeLighting();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Toggle Right Panel Button */}
        {!showRightPanel && (
          <button
            onClick={() => setShowRightPanel(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg p-2 shadow-lg hover:bg-gray-50 transition-colors z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
