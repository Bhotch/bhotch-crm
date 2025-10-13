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
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sample property data
  const properties = [
    { id: 1, name: '123 Main St', image: null, thumbnail: null },
    { id: 2, name: '456 Oak Ave', image: null, thumbnail: null },
    { id: 3, name: '789 Pine Rd', image: null, thumbnail: null },
  ];

  // Design layers
  const layers = [
    { id: 'roof', name: 'Roof', icon: Home, visible: true, locked: false },
    { id: 'siding', name: 'Siding', icon: Layers, visible: true, locked: false },
    { id: 'trim', name: 'Trim', icon: Palette, visible: true, locked: false },
    { id: 'gutters', name: 'Gutters', icon: Grid, visible: true, locked: false },
  ];

  // Material library
  const materials = {
    roof: [
      { id: 'asphalt-shingle', name: 'Asphalt Shingle', color: '#334155' },
      { id: 'metal-standing-seam', name: 'Metal Standing Seam', color: '#64748b' },
      { id: 'tile', name: 'Clay Tile', color: '#dc2626' },
      { id: 'slate', name: 'Natural Slate', color: '#1e293b' },
    ],
    siding: [
      { id: 'vinyl', name: 'Vinyl Siding', color: '#f8fafc' },
      { id: 'fiber-cement', name: 'Fiber Cement', color: '#e2e8f0' },
      { id: 'wood', name: 'Wood Siding', color: '#92400e' },
    ],
    trim: [
      { id: 'white', name: 'White', color: '#ffffff' },
      { id: 'black', name: 'Black', color: '#000000' },
      { id: 'brown', name: 'Brown', color: '#78350f' },
    ],
  };

  // Color palette
  const colorPalette = [
    { name: 'Charcoal', hex: '#334155' },
    { name: 'Slate Gray', hex: '#64748b' },
    { name: 'Weathered Wood', hex: '#92400e' },
    { name: 'Terracotta', hex: '#dc2626' },
    { name: 'Forest Green', hex: '#065f46' },
    { name: 'Colonial Blue', hex: '#1e40af' },
    { name: 'Tan', hex: '#d6bc8a' },
    { name: 'White', hex: '#ffffff' },
  ];

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

            <div className="p-4 border-t border-gray-200">
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add Layer
              </button>
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
                  <img
                    src={uploadedImage}
                    alt="Uploaded property"
                    className="w-full h-full object-contain"
                  />
                  {model3D && (
                    <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                      ✓ 3D Model Generated
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
              {/* Material Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedLayer.charAt(0).toUpperCase() + selectedLayer.slice(1)} Materials
                </h3>
                <div className="space-y-2">
                  {(materials[selectedLayer] || materials.roof).map(material => (
                    <div
                      key={material.id}
                      onClick={() => setSelectedMaterial(material.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedMaterial === material.id
                          ? 'bg-blue-50 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: material.color }}
                      />
                      <span className="flex-1 font-medium text-sm text-gray-900">{material.name}</span>
                      {selectedMaterial === material.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Color Palette</h3>
                <div className="grid grid-cols-4 gap-2">
                  {colorPalette.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.hex)}
                      className={`aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                        selectedColor === color.hex
                          ? 'border-blue-600 ring-2 ring-blue-200'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Color</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 space-y-2">
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
              <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                <RotateCcw className="w-4 h-4" />
                Reset Design
              </button>
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
