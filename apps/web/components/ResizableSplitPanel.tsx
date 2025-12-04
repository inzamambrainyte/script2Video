"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizableSection {
  id: string;
  content: ReactNode;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  collapsible?: boolean;
}

interface ResizableSplitPanelProps {
  sections: ResizableSection[];
  direction?: "vertical" | "horizontal";
}

export default function ResizableSplitPanel({
  sections,
  direction = "vertical",
}: ResizableSplitPanelProps) {
  const [heights, setHeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    sections.forEach((section) => {
      initial[section.id] = section.defaultHeight || 200;
    });
    return initial;
  });

  const [isResizing, setIsResizing] = useState<{
    sectionIndex: number;
    startY: number;
    startHeight: number;
    prevHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const { sectionIndex, startY, startHeight, prevHeight } = isResizing;
      const section = sections[sectionIndex];
      if (!section) return;

      // Calculate delta from start position
      const deltaY = e.clientY - startY;
      
      // Calculate new height
      let newHeight = startHeight + deltaY;

      // Apply constraints
      const minHeight = section.minHeight || 100;
      const maxHeight = section.maxHeight || 600;
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Update height
      setHeights((prev) => ({
        ...prev,
        [section.id]: newHeight,
      }));
    };

    const handleMouseUp = () => {
      setIsResizing(null);
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
  }, [isResizing, sections]);

  const handleMouseDown = (
    e: React.MouseEvent,
    sectionIndex: number,
    position: "top" | "bottom"
  ) => {
    const section = sections[sectionIndex];
    if (!section) return;

    const currentHeight = heights[section.id] || section.defaultHeight || 200;
    setIsResizing({
      sectionIndex,
      startY: e.clientY,
      startHeight: currentHeight,
      prevHeight: currentHeight,
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {sections.map((section, index) => {
        const sectionHeight = heights[section.id] || section.defaultHeight || 200;
        const isLast = index === sections.length - 1;

        return (
          <div key={section.id} className="relative flex flex-col">
            {/* Top Resize Handle */}
            {index > 0 && (
              <div
                className="h-1 cursor-row-resize hover:bg-pink-500 transition-colors z-10 relative"
                onMouseDown={(e) => handleMouseDown(e, index, "top")}
              >
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            )}

            {/* Section Content */}
            <div
              className={isLast ? "flex-1 min-h-0 overflow-hidden" : "flex-shrink-0 overflow-hidden"}
              style={{ 
                height: isLast ? "auto" : `${sectionHeight}px`,
                minHeight: isLast ? "0" : `${section.minHeight || 100}px`,
                maxHeight: isLast ? "none" : `${section.maxHeight || 600}px`,
              }}
            >
              <div className="h-full w-full overflow-hidden">
                {section.content}
              </div>
            </div>

            {/* Bottom Resize Handle */}
            {!isLast && (
              <div
                className="h-1 cursor-row-resize hover:bg-pink-500 transition-colors z-10 relative"
                onMouseDown={(e) => handleMouseDown(e, index, "bottom")}
              >
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-gray-600 rounded-full opacity-0 hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

