"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  direction?: "up" | "down";
  onResize?: (height: number) => void;
}

export default function ResizablePanel({
  children,
  defaultHeight = 200,
  minHeight = 100,
  maxHeight = 600,
  direction = "up",
  onResize,
}: ResizablePanelProps) {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newHeight =
        direction === "up"
          ? e.clientY - rect.top
          : rect.bottom - e.clientY;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setHeight(newHeight);
        onResize?.(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minHeight, maxHeight, direction, onResize]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col"
      style={{ height: `${height}px` }}
    >
      {/* Resize Handle - Top */}
      {direction === "up" && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-pink-500 transition-colors z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Resize Handle - Bottom */}
      {direction === "down" && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-pink-500 transition-colors z-10"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
        </div>
      )}

      {/* Height Indicator (optional, can be removed) */}
      {isResizing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none">
          {Math.round(height)}px
        </div>
      )}
    </div>
  );
}

