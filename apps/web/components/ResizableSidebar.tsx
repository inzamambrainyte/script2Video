"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizableSidebarProps {
  children: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: "left" | "right";
}

export default function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 200,
  maxWidth = 800,
  side = "right",
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth =
        side === "right"
          ? window.innerWidth - e.clientX
          : e.clientX;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, maxWidth, side]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  return (
    <div
      ref={sidebarRef}
      className="relative flex flex-col bg-gray-800 border-l border-gray-700"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-pink-500 transition-colors z-10 ${
          side === "right" ? "-left-0.5" : "-right-0.5"
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden">{children}</div>

      {/* Width Indicator (optional, can be removed) */}
      {isResizing && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none">
          {Math.round(width)}px
        </div>
      )}
    </div>
  );
}

