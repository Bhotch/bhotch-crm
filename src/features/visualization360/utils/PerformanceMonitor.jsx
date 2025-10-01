import React, { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
// import { Perf } from 'r3f-perf';
import Stats from 'stats.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Cpu, HardDrive, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

/**
 * Performance Monitoring System
 * Tracks and displays real-time performance metrics for 3D visualization:
 * - FPS (Frames Per Second)
 * - Memory Usage
 * - Draw Calls
 * - Triangles/Vertices
 * - Texture Memory
 * - Scene Complexity
 */

// Core Performance Monitor Hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    frameTime: 16.67,
    memory: { used: 0, limit: 0 },
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    programs: 0,
    geometries: 0,
    renderTime: 0,
    cpuUsage: 0
  });

  const [performance, setPerformance] = useState({
    rating: 'excellent', // excellent, good, fair, poor
    issues: [],
    recommendations: []
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef([]);

  const { gl, scene } = useThree();

  useFrame(() => {
    const now = performance.now();
    const delta = now - lastTime.current;

    frameCount.current++;

    // Update every 30 frames for performance
    if (frameCount.current % 30 === 0) {
      const fps = Math.round(1000 / delta);
      fpsHistory.current.push(fps);

      // Keep only last 100 samples
      if (fpsHistory.current.length > 100) {
        fpsHistory.current.shift();
      }

      // Get renderer info
      const info = gl.info;

      // Calculate memory if available
      let memoryUsage = { used: 0, limit: 0 };
      if (performance.memory) {
        memoryUsage = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        };
      }

      // Count scene objects
      let triangles = 0;
      let vertices = 0;
      scene.traverse((obj) => {
        if (obj.geometry) {
          const geo = obj.geometry;
          if (geo.index) {
            triangles += geo.index.count / 3;
          } else if (geo.attributes.position) {
            vertices += geo.attributes.position.count;
            triangles += vertices / 3;
          }
        }
      });

      setMetrics({
        fps,
        frameTime: delta,
        memory: memoryUsage,
        drawCalls: info.render.calls,
        triangles: Math.round(triangles),
        textures: info.memory.textures,
        programs: info.programs?.length || 0,
        geometries: info.memory.geometries,
        renderTime: delta,
        cpuUsage: getCPUUsage()
      });

      // Analyze performance
      analyzePerformance(fps, memoryUsage, info, triangles);
    }

    lastTime.current = now;
  });

  const analyzePerformance = (fps, memory, info, triangles) => {
    const issues = [];
    const recommendations = [];
    let rating = 'excellent';

    // FPS Analysis
    if (fps < 30) {
      rating = 'poor';
      issues.push('Very low FPS detected');
      recommendations.push('Reduce scene complexity or number of lights');
    } else if (fps < 45) {
      rating = 'fair';
      issues.push('Low FPS detected');
      recommendations.push('Consider simplifying geometry or textures');
    } else if (fps < 55) {
      rating = 'good';
    }

    // Memory Analysis
    if (memory.used > memory.limit * 0.9) {
      issues.push('Memory usage critical');
      recommendations.push('Clear texture cache or reduce asset quality');
      rating = 'poor';
    } else if (memory.used > memory.limit * 0.7) {
      issues.push('High memory usage');
      recommendations.push('Monitor memory usage closely');
      if (rating === 'excellent') rating = 'good';
    }

    // Draw Calls Analysis
    if (info.render.calls > 200) {
      issues.push('Too many draw calls');
      recommendations.push('Merge geometries or use instancing');
      if (rating === 'excellent') rating = 'good';
    }

    // Triangles Analysis
    if (triangles > 1000000) {
      issues.push('Very high polygon count');
      recommendations.push('Use LOD (Level of Detail) or simplify models');
      if (rating === 'excellent') rating = 'fair';
    } else if (triangles > 500000) {
      issues.push('High polygon count');
      recommendations.push('Consider optimizing geometry');
    }

    // Textures Analysis
    if (info.memory.textures > 50) {
      issues.push('Many textures loaded');
      recommendations.push('Implement texture atlasing or compression');
    }

    setPerformance({ rating, issues, recommendations });
  };

  const getCPUUsage = () => {
    // Estimate CPU usage based on frame time
    const avgFrameTime = fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length;
    const targetFrameTime = 16.67; // 60 FPS
    return Math.min(100, (avgFrameTime / targetFrameTime) * 100);
  };

  const getAverageFPS = () => {
    if (fpsHistory.current.length === 0) return 60;
    return Math.round(
      fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
    );
  };

  return {
    metrics,
    performance,
    getAverageFPS,
    fpsHistory: fpsHistory.current
  };
};

// Performance Monitor Component (3D Overlay)
export const PerformanceMonitor3D = ({ enabled = true, position = 'top-left' }) => {
  if (!enabled) return null;

  // r3f-perf removed for React 18 compatibility
  return null;
};

// Performance Dashboard Component (UI)
export const PerformanceDashboard = ({ show = false, onClose }) => {
  const { metrics, performance, getAverageFPS, fpsHistory } = usePerformanceMonitor();

  const getRatingColor = (rating) => {
    switch (rating) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-blue-400';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'excellent':
      case 'good':
        return <TrendingUp className="w-5 h-5"/>;
      case 'fair':
        return <Activity className="w-5 h-5"/>;
      case 'poor':
        return <TrendingDown className="w-5 h-5"/>;
      default:
        return <Activity className="w-5 h-5"/>;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed top-20 right-4 w-96 bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-white"/>
                <div>
                  <h3 className="text-white font-bold">Performance Monitor</h3>
                  <p className="text-blue-100 text-xs">Real-time metrics</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Overall Rating */}
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Overall Performance</span>
                <div className={`flex items-center gap-2 ${getRatingColor(performance.rating)}`}>
                  {getRatingIcon(performance.rating)}
                  <span className="font-bold capitalize">{performance.rating}</span>
                </div>
              </div>
              <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    performance.rating === 'excellent'
                      ? 'bg-green-500'
                      : performance.rating === 'good'
                      ? 'bg-blue-500'
                      : performance.rating === 'fair'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${
                      performance.rating === 'excellent'
                        ? 100
                        : performance.rating === 'good'
                        ? 75
                        : performance.rating === 'fair'
                        ? 50
                        : 25
                    }%`
                  }}
               />
              </div>
            </div>

            {/* FPS Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400"/>
                  <span className="text-slate-400 text-xs">Current FPS</span>
                </div>
                <div className="text-white text-2xl font-bold">{metrics.fps}</div>
                <div className="text-slate-500 text-xs">Target: 60 FPS</div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-blue-400"/>
                  <span className="text-slate-400 text-xs">Avg FPS</span>
                </div>
                <div className="text-white text-2xl font-bold">{getAverageFPS()}</div>
                <div className="text-slate-500 text-xs">Last 100 frames</div>
              </div>
            </div>

            {/* Memory & CPU */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-4 h-4 text-green-400"/>
                  <span className="text-slate-400 text-xs">Memory</span>
                </div>
                <div className="text-white text-xl font-bold">
                  {metrics.memory.used} MB
                </div>
                <div className="text-slate-500 text-xs">
                  of {metrics.memory.limit} MB
                </div>
                <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${(metrics.memory.used / metrics.memory.limit) * 100}%`
                    }}
                 />
                </div>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-purple-400"/>
                  <span className="text-slate-400 text-xs">CPU Usage</span>
                </div>
                <div className="text-white text-xl font-bold">
                  {metrics.cpuUsage.toFixed(1)}%
                </div>
                <div className="text-slate-500 text-xs">Estimated</div>
                <div className="mt-2 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${metrics.cpuUsage}%` }}
                 />
                </div>
              </div>
            </div>

            {/* Render Stats */}
            <div className="bg-slate-700/50 rounded-lg p-3">
              <h4 className="text-white font-semibold mb-3 text-sm">Render Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Draw Calls:</span>
                  <span className="text-white font-mono">{metrics.drawCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Triangles:</span>
                  <span className="text-white font-mono">{metrics.triangles.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Textures:</span>
                  <span className="text-white font-mono">{metrics.textures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Geometries:</span>
                  <span className="text-white font-mono">{metrics.geometries}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Programs:</span>
                  <span className="text-white font-mono">{metrics.programs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frame Time:</span>
                  <span className="text-white font-mono">{metrics.frameTime.toFixed(2)}ms</span>
                </div>
              </div>
            </div>

            {/* FPS History Graph */}
            <div className="bg-slate-700/50 rounded-lg p-3">
              <h4 className="text-white font-semibold mb-3 text-sm">FPS History</h4>
              <div className="h-20 flex items-end gap-0.5">
                {fpsHistory.slice(-50).map((fps, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                    style={{
                      height: `${(fps / 60) * 100}%`,
                      opacity: 0.7 + (idx / 50) * 0.3
                    }}
                 />
                ))}
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>0 FPS</span>
                <span>60 FPS</span>
              </div>
            </div>

            {/* Issues */}
            {performance.issues.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400"/>
                  <h4 className="text-red-400 font-semibold text-sm">Issues Detected</h4>
                </div>
                <ul className="space-y-1">
                  {performance.issues.map((issue, idx) => (
                    <li key={idx} className="text-red-300 text-xs">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {performance.recommendations.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-blue-400 font-semibold text-sm mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {performance.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-blue-300 text-xs">
                      💡 {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Simple FPS Counter Component
export const FPSCounter = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useFrame(() => {
    const now = performance.now();
    frameCount.current++;

    if (frameCount.current % 30 === 0) {
      const delta = now - lastTime.current;
      setFps(Math.round(1000 / (delta / 30)));
      lastTime.current = now;
    }
  });

  return (
    <div className="fixed top-4 left-4 bg-black/80 text-white px-3 py-2 rounded-lg font-mono text-sm z-50">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-yellow-400"/>
        <span className="font-bold">{fps}</span>
        <span className="text-slate-400">FPS</span>
      </div>
    </div>
  );
};

// Export all components
export default {
  PerformanceMonitor3D,
  PerformanceDashboard,
  FPSCounter,
  usePerformanceMonitor
};
