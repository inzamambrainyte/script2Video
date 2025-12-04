"use client";

import { SceneAsset } from "@/types";

interface TransformControlsProps {
  asset: SceneAsset;
  onUpdate: (updates: Partial<SceneAsset>) => void;
  onClose?: () => void;
}

export default function TransformControls({
  asset,
  onUpdate,
  onClose,
}: TransformControlsProps) {
  // Guard against undefined asset
  if (!asset) {
    return (
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <p className="text-sm text-gray-400 text-center">No asset selected</p>
      </div>
    );
  }

  if (asset.type === "audio") {
    return (
      <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-4 overflow-y-auto max-h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Audio Controls</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Close"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Start Time: {asset.startTime || 0}s
          </label>
          <input
            type="range"
            min="0"
            max="60"
            step="0.1"
            value={asset.startTime || 0}
            onChange={(e) => onUpdate({ startTime: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Volume: {((asset.volume || 1) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={asset.volume || 1}
            onChange={(e) => onUpdate({ volume: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Opacity: {((asset.opacity ?? 0) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={asset.opacity ?? 0}
            onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <p className="text-xs text-gray-400 mt-1">
            Control visibility of audio controls in preview (0 = hidden, 1 = visible)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Transform Controls</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Close"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Position */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-300 mb-1">X Position</label>
          <input
            type="number"
            value={asset.x || 0}
            onChange={(e) => onUpdate({ x: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            step="1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-300 mb-1">Y Position</label>
          <input
            type="number"
            value={asset.y || 0}
            onChange={(e) => onUpdate({ y: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            step="1"
          />
        </div>
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-300 mb-1">Width</label>
          <input
            type="number"
            value={asset.width || 100}
            onChange={(e) => onUpdate({ width: parseFloat(e.target.value) || 100 })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            step="1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-300 mb-1">Height</label>
          <input
            type="number"
            value={asset.height || 100}
            onChange={(e) => onUpdate({ height: parseFloat(e.target.value) || 100 })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            step="1"
          />
        </div>
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Scale: {((asset.scale || 1) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="3"
          step="0.1"
          value={asset.scale || 1}
          onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Rotation: {asset.rotation || 0}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          step="1"
          value={asset.rotation || 0}
          onChange={(e) => onUpdate({ rotation: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Opacity: {((asset.opacity || 1) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={asset.opacity || 1}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Layer Order (Z-Index) */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">Layer Order</label>
        <input
          type="number"
          value={asset.zIndex || 0}
          onChange={(e) => onUpdate({ zIndex: parseInt(e.target.value) || 0 })}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          step="1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Higher numbers appear on top
        </p>
      </div>

      {/* Animation Controls */}
      <div className="border-t border-gray-700 pt-4 space-y-3">
        <h4 className="text-xs font-semibold text-white mb-2">Animation</h4>
        
        {/* Animation Type */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">Animation Type</label>
          <select
            value={(asset as any).animationType || "fadeIn"}
            onChange={(e) => onUpdate({ animationType: e.target.value as any })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="none">None</option>
            <option value="fadeIn">Fade In</option>
            <option value="slideInLeft">Slide In Left</option>
            <option value="slideInRight">Slide In Right</option>
            <option value="slideInTop">Slide In Top</option>
            <option value="slideInBottom">Slide In Bottom</option>
            <option value="zoomIn">Zoom In</option>
            <option value="zoomOut">Zoom Out</option>
            <option value="rotateIn">Rotate In</option>
            <option value="kenBurns">Ken Burns</option>
          </select>
        </div>

        {/* Animation Duration */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Duration: {((asset as any).animationDuration || 1).toFixed(1)}s
          </label>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={(asset as any).animationDuration || 1}
            onChange={(e) => onUpdate({ animationDuration: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        {/* Animation Delay */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Delay: {((asset as any).animationDelay || 0).toFixed(1)}s
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={(asset as any).animationDelay || 0}
            onChange={(e) => onUpdate({ animationDelay: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>

        {/* Animation Easing */}
        <div>
          <label className="block text-xs text-gray-300 mb-1">Easing</label>
          <select
            value={(asset as any).animationEasing || "easeOut"}
            onChange={(e) => onUpdate({ animationEasing: e.target.value as any })}
            className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="linear">Linear</option>
            <option value="easeIn">Ease In</option>
            <option value="easeOut">Ease Out</option>
            <option value="easeInOut">Ease In Out</option>
          </select>
        </div>
      </div>
    </div>
  );
}

