"use client";

import { CaptionStyle } from "@/types";

interface CaptionTransformControlsProps {
  captionStyle: CaptionStyle;
  onUpdate: (updates: Partial<CaptionStyle>) => void;
  onClose?: () => void;
}

export default function CaptionTransformControls({
  captionStyle,
  onUpdate,
  onClose,
}: CaptionTransformControlsProps) {
  const style = captionStyle || {};

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Caption Transform</h3>
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

      {/* Position Preset */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">Position</label>
        <select
          value={style.position || "bottom"}
          onChange={(e) => {
            const position = e.target.value as CaptionStyle["position"];
            if (position === "bottom") {
              onUpdate({ position, x: undefined, y: undefined });
            } else if (position === "top") {
              onUpdate({ position, x: undefined, y: 5 });
            } else if (position === "center") {
              onUpdate({ position, x: 50, y: 50 });
            } else {
              onUpdate({ position });
            }
          }}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="bottom">Bottom</option>
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Custom Position (only show if custom) */}
      {style.position === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-300 mb-1">X Position (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={style.x || 50}
              onChange={(e) => onUpdate({ x: parseFloat(e.target.value) || 50 })}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-300 mb-1">Y Position (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={style.y || 80}
              onChange={(e) => onUpdate({ y: parseFloat(e.target.value) || 80 })}
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      )}

      {/* Font Size */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Font Size: {style.fontSize || 18}px
        </label>
        <input
          type="range"
          min="12"
          max="72"
          step="1"
          value={style.fontSize || 18}
          onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Max Width */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Max Width: {style.maxWidth || 800}px
        </label>
        <input
          type="range"
          min="200"
          max="1920"
          step="10"
          value={style.maxWidth || 800}
          onChange={(e) => onUpdate({ maxWidth: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Padding */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Padding: {style.padding || 12}px
        </label>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          value={style.padding || 12}
          onChange={(e) => onUpdate({ padding: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Text Alignment */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">Text Alignment</label>
        <div className="flex gap-2">
          {(["left", "center", "right"] as const).map((align) => (
            <button
              key={align}
              onClick={() => onUpdate({ textAlign: align })}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                (style.textAlign || "center") === align
                  ? "bg-primary-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {align.charAt(0).toUpperCase() + align.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-300 mb-1">Background Color</label>
          <input
            type="color"
            value={style.backgroundColor || "#000000"}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
            className="w-full h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Background Opacity: {((style.backgroundOpacity || 0.75) * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={style.backgroundOpacity || 0.75}
            onChange={(e) => onUpdate({ backgroundOpacity: parseFloat(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>
      </div>

      {/* Text Color */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">Text Color</label>
        <input
          type="color"
          value={style.textColor || "#ffffff"}
          onChange={(e) => onUpdate({ textColor: e.target.value })}
          className="w-full h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
        />
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">Font Weight</label>
        <select
          value={style.fontWeight || "medium"}
          onChange={(e) => {
            const value = e.target.value;
            onUpdate({
              fontWeight:
                value === "normal" || value === "bold" || value === "lighter"
                  ? value
                  : parseInt(value),
            });
          }}
          className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="normal">Normal</option>
          <option value="medium">Medium</option>
          <option value="bold">Bold</option>
          <option value="lighter">Lighter</option>
          <option value="600">Semi-Bold</option>
          <option value="700">Bold</option>
        </select>
      </div>

      {/* Border */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-300 mb-1">
            Border Width: {style.borderWidth || 0}px
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={style.borderWidth || 0}
            onChange={(e) => onUpdate({ borderWidth: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
        </div>
        {style.borderWidth && style.borderWidth > 0 && (
          <div>
            <label className="block text-xs text-gray-300 mb-1">Border Color</label>
            <input
              type="color"
              value={style.borderColor || "#ffffff"}
              onChange={(e) => onUpdate({ borderColor: e.target.value })}
              className="w-full h-8 bg-gray-700 border border-gray-600 rounded cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Border Radius: {style.borderRadius || 8}px
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={style.borderRadius || 8}
          onChange={(e) => onUpdate({ borderRadius: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Scale */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Scale: {((style.scale || 1) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={style.scale || 1}
          onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs text-gray-300 mb-1">
          Opacity: {((style.opacity || 1) * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={style.opacity || 1}
          onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Effects */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={style.shadow || false}
            onChange={(e) => onUpdate({ shadow: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
          />
          Text Shadow
        </label>
        {style.shadow && (
          <div>
            <label className="block text-xs text-gray-300 mb-1">
              Backdrop Blur: {style.blur || 0}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={style.blur || 0}
              onChange={(e) => onUpdate({ blur: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
          </div>
        )}
      </div>
    </div>
  );
}

