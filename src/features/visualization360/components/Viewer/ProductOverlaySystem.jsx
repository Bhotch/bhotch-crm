import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  Html,
  TransformControls,
  GizmoHelper,
  GizmoViewport
} from '@react-three/drei';
import { useDrag, useGesture } from '@use-gesture/react';
import * as THREE from 'three';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Move,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Download,
  Upload,
  Grid3x3,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

// Product types that can be overlaid
const PRODUCT_TYPES = {
  shingle: {
    name: 'Shingles',
    icon: '🏠',
    defaultSize: [2, 1, 0.05],
    snapToGrid: true,
    allowRotation: true,
    allowScale: true
  },
  light: {
    name: 'Lighting',
    icon: '💡',
    defaultSize: [0.2, 0.2, 0.3],
    snapToGrid: false,
    allowRotation: true,
    allowScale: false
  },
  vent: {
    name: 'Ridge Vent',
    icon: '🌬️',
    defaultSize: [3, 0.3, 0.2],
    snapToGrid: true,
    allowRotation: false,
    allowScale: true
  },
  gutter: {
    name: 'Gutter',
    icon: '🚰',
    defaultSize: [5, 0.15, 0.15],
    snapToGrid: false,
    allowRotation: false,
    allowScale: true
  },
  flashing: {
    name: 'Flashing',
    icon: '🔧',
    defaultSize: [1, 0.5, 0.02],
    snapToGrid: true,
    allowRotation: true,
    allowScale: true
  }
};

// Draggable 3D Product Component
const DraggableProduct = ({
  id,
  type,
  position,
  rotation,
  scale,
  color,
  texture,
  isSelected,
  isLocked,
  isVisible,
  onSelect,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  snapToGrid = true,
  gridSize = 0.5
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const productConfig = PRODUCT_TYPES[type];

  // Load texture
  const textureMap = useTexture(texture || '', (tex) => {
    if (tex) {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
    }
  });

  // Snap position to grid
  const snapPosition = useCallback(
    (pos) => {
      if (!snapToGrid || !productConfig.snapToGrid) return pos;
      return [
        Math.round(pos[0] / gridSize) * gridSize,
        Math.round(pos[1] / gridSize) * gridSize,
        Math.round(pos[2] / gridSize) * gridSize
      ];
    },
    [snapToGrid, gridSize, productConfig]
  );

  // Drag gesture
  const bind = useDrag(
    ({ event, offset: [x, y], last }) => {
      if (isLocked || !isSelected) return;

      event.stopPropagation();
      setIsDragging(!last);

      // Convert 2D drag to 3D position
      const newPos = [position[0] + x * 0.01, position[1], position[2] + y * 0.01];
      const snappedPos = snapPosition(newPos);

      onPositionChange?.(snappedPos);
    },
    { from: [position[0] * 100, position[2] * 100] }
  );

  useFrame(() => {
    if (meshRef.current && isSelected && !isLocked) {
      // Pulse effect when selected
      const pulseFactor = 1 + Math.sin(Date.now() * 0.005) * 0.05;
      meshRef.current.scale.setScalar(pulseFactor);
    }
  });

  if (!isVisible) return null;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        {...bind()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        scale={scale}
        castShadow
        receiveShadow
      >
        <boxGeometry args={productConfig.defaultSize} />
        <meshStandardMaterial
          color={isSelected ? '#4F46E5' : color}
          map={texture ? textureMap : null}
          transparent
          opacity={isDragging ? 0.7 : 1}
          roughness={0.8}
          metalness={0.2}
          emissive={hovered || isSelected ? '#4F46E5' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.2 : 0}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(...productConfig.defaultSize)]} />
          <lineBasicMaterial attach="material" color="#4F46E5" linewidth={2} />
        </lineSegments>
      )}

      {/* Lock indicator */}
      {isLocked && (
        <Html position={[0, productConfig.defaultSize[1] / 2 + 0.3, 0]} center>
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </div>
        </Html>
      )}

      {/* Label */}
      {(hovered || isSelected) && !isLocked && (
        <Html position={[0, productConfig.defaultSize[1] / 2 + 0.5, 0]} center>
          <div className="bg-slate-800 text-white px-3 py-1 rounded-lg text-xs whitespace-nowrap shadow-lg border border-slate-600">
            {productConfig.icon} {productConfig.name} #{id}
          </div>
        </Html>
      )}
    </group>
  );
};

// Transform Gizmo for selected product
const ProductTransformControls = ({ productId, products, onUpdate, mode = 'translate' }) => {
  const product = products.find((p) => p.id === productId);
  const controlsRef = useRef();

  if (!product || product.isLocked) return null;

  return (
    <TransformControls
      ref={controlsRef}
      object={product.meshRef}
      mode={mode}
      onObjectChange={(e) => {
        if (!e?.target?.object) return;

        const obj = e.target.object;

        if (mode === 'translate') {
          onUpdate(productId, { position: obj.position.toArray() });
        } else if (mode === 'rotate') {
          onUpdate(productId, { rotation: obj.rotation.toArray().slice(0, 3) });
        } else if (mode === 'scale') {
          onUpdate(productId, { scale: obj.scale.toArray() });
        }
      }}
    />
  );
};

// 3D Scene
const OverlayScene = ({
  products,
  selectedProductId,
  onSelectProduct,
  onUpdateProduct,
  showGrid,
  snapToGrid,
  gridSize,
  backgroundImage
}) => {
  const { camera } = useThree();

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={60} />
      <OrbitControls enablePan enableZoom enableRotate />

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 10, -5]} intensity={0.5} />

      {showGrid && (
        <gridHelper args={[20, 20, '#4B5563', '#374151']} position={[0, 0, 0]} />
      )}

      {/* Background plane with image */}
      {backgroundImage && (
        <mesh position={[0, 0, -2]} receiveShadow>
          <planeGeometry args={[16, 9]} />
          <meshBasicMaterial map={useTexture(backgroundImage)} />
        </mesh>
      )}

      {/* Render all products */}
      {products.map((product) => (
        <DraggableProduct
          key={product.id}
          {...product}
          isSelected={selectedProductId === product.id}
          onSelect={() => onSelectProduct(product.id)}
          onPositionChange={(pos) => onUpdateProduct(product.id, { position: pos })}
          onRotationChange={(rot) => onUpdateProduct(product.id, { rotation: rot })}
          onScaleChange={(scl) => onUpdateProduct(product.id, { scale: scl })}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
        />
      ))}

      {/* Transform controls for selected product */}
      {selectedProductId && (
        <ProductTransformControls
          productId={selectedProductId}
          products={products}
          onUpdate={onUpdateProduct}
          mode="translate"
        />
      )}

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>
    </>
  );
};

// Product List Panel
const ProductListPanel = ({
  products,
  selectedProductId,
  onSelectProduct,
  onToggleVisibility,
  onToggleLock,
  onDuplicateProduct,
  onDeleteProduct
}) => {
  return (
    <div className="space-y-2">
      {products.map((product) => {
        const config = PRODUCT_TYPES[product.type];
        const isSelected = selectedProductId === product.id;

        return (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectProduct(product.id)}
            className={`p-3 rounded-lg border cursor-pointer transition ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{config.icon}</span>
                <div>
                  <div className="text-white text-sm font-medium">
                    {config.name} #{product.id}
                  </div>
                  <div className="text-slate-400 text-xs">
                    x: {product.position[0].toFixed(1)} y: {product.position[1].toFixed(1)} z:{' '}
                    {product.position[2].toFixed(1)}
                  </div>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility(product.id);
                  }}
                  className="p-1 hover:bg-slate-600 rounded transition"
                  title={product.isVisible ? 'Hide' : 'Show'}
                >
                  {product.isVisible ? (
                    <Eye className="w-4 h-4 text-blue-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(product.id);
                  }}
                  className="p-1 hover:bg-slate-600 rounded transition"
                  title={product.isLocked ? 'Unlock' : 'Lock'}
                >
                  {product.isLocked ? (
                    <Lock className="w-4 h-4 text-red-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-green-400" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateProduct(product.id);
                  }}
                  className="p-1 hover:bg-slate-600 rounded transition"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProduct(product.id);
                  }}
                  className="p-1 hover:bg-red-600 rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}

      {products.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No products added yet</p>
          <p className="text-xs">Click a product type to add</p>
        </div>
      )}
    </div>
  );
};

// Main Component
const ProductOverlaySystem = ({ backgroundImage, onSave }) => {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.5);
  const [transformMode, setTransformMode] = useState('translate');

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Add product
  const handleAddProduct = useCallback((type) => {
    const config = PRODUCT_TYPES[type];
    const newProduct = {
      id: Date.now(),
      type,
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: '#8B7355',
      texture: null,
      isVisible: true,
      isLocked: false
    };

    setProducts((prev) => [...prev, newProduct]);
    setSelectedProductId(newProduct.id);
  }, []);

  // Update product
  const handleUpdateProduct = useCallback((id, updates) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === id ? { ...product, ...updates } : product))
    );
  }, []);

  // Delete product
  const handleDeleteProduct = useCallback((id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    if (selectedProductId === id) {
      setSelectedProductId(null);
    }
  }, [selectedProductId]);

  // Duplicate product
  const handleDuplicateProduct = useCallback((id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      const newProduct = {
        ...product,
        id: Date.now(),
        position: [product.position[0] + 1, product.position[1], product.position[2] + 1]
      };
      setProducts((prev) => [...prev, newProduct]);
      setSelectedProductId(newProduct.id);
    }
  }, [products]);

  // Toggle visibility
  const handleToggleVisibility = useCallback((id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isVisible: !p.isVisible } : p))
    );
  }, []);

  // Toggle lock
  const handleToggleLock = useCallback((id) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isLocked: !p.isLocked } : p))
    );
  }, []);

  // Export configuration
  const handleExport = useCallback(() => {
    const config = {
      products: products.map((p) => ({
        type: p.type,
        position: p.position,
        rotation: p.rotation,
        scale: p.scale,
        color: p.color,
        isVisible: p.isVisible
      })),
      settings: { showGrid, snapToGrid, gridSize }
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-overlay-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [products, showGrid, snapToGrid, gridSize]);

  // Import configuration
  const handleImport = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        setProducts(config.products.map((p, idx) => ({ ...p, id: Date.now() + idx })));
        if (config.settings) {
          setShowGrid(config.settings.showGrid);
          setSnapToGrid(config.settings.snapToGrid);
          setGridSize(config.settings.gridSize);
        }
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Product Overlay System</h2>
              <p className="text-sm text-slate-400">{products.length} products placed</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-3 py-2 rounded-lg transition ${
                showGrid ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'
              } text-white`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`px-3 py-2 rounded-lg transition ${
                snapToGrid ? 'bg-green-600' : 'bg-slate-700 hover:bg-slate-600'
              } text-white text-sm`}
              title="Snap to Grid"
            >
              Snap
            </button>

            <label className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExport}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => onSave?.(products)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Save to Project
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Add Products */}
        <div className="w-64 bg-slate-800/50 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-semibold mb-4">Add Products</h3>

          <div className="space-y-2 mb-6">
            {Object.entries(PRODUCT_TYPES).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleAddProduct(key)}
                className="w-full p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-left flex items-center gap-3"
              >
                <span className="text-2xl">{config.icon}</span>
                <span className="text-white text-sm font-medium">{config.name}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-700">
            <h3 className="text-white font-semibold">Settings</h3>

            <div>
              <label className="text-sm text-slate-400 block mb-2">Grid Size</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={gridSize}
                onChange={(e) => setGridSize(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-white text-xs mt-1">{gridSize.toFixed(1)}m</div>
            </div>
          </div>
        </div>

        {/* Center - 3D Viewer */}
        <div className="flex-1 relative">
          <Canvas shadows>
            <OverlayScene
              products={products}
              selectedProductId={selectedProductId}
              onSelectProduct={setSelectedProductId}
              onUpdateProduct={handleUpdateProduct}
              showGrid={showGrid}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
              backgroundImage={backgroundImage}
            />
          </Canvas>

          {/* Transform mode selector */}
          {selectedProduct && !selectedProduct.isLocked && (
            <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 flex gap-2">
              {['translate', 'rotate', 'scale'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTransformMode(mode)}
                  className={`px-3 py-2 rounded transition ${
                    transformMode === mode
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {mode === 'translate' && <Move className="w-4 h-4" />}
                  {mode === 'rotate' && <RotateCcw className="w-4 h-4" />}
                  {mode === 'scale' && <Maximize2 className="w-4 h-4" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar - Product List & Properties */}
        <div className="w-80 bg-slate-800/50 border-l border-slate-700 overflow-y-auto p-4">
          <h3 className="text-white font-semibold mb-4">Products</h3>

          <ProductListPanel
            products={products}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onDuplicateProduct={handleDuplicateProduct}
            onDeleteProduct={handleDeleteProduct}
          />

          {/* Selected product properties */}
          {selectedProduct && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Properties
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-2">Color</label>
                  <input
                    type="color"
                    value={selectedProduct.color}
                    onChange={(e) =>
                      handleUpdateProduct(selectedProduct.id, { color: e.target.value })
                    }
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 block mb-2">Position</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map((axis, idx) => (
                      <div key={axis}>
                        <label className="text-xs text-slate-500 block mb-1">{axis}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={selectedProduct.position[idx].toFixed(1)}
                          onChange={(e) => {
                            const newPos = [...selectedProduct.position];
                            newPos[idx] = parseFloat(e.target.value) || 0;
                            handleUpdateProduct(selectedProduct.id, { position: newPos });
                          }}
                          className="w-full bg-slate-700 text-white rounded px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductOverlaySystem;
export { PRODUCT_TYPES };
