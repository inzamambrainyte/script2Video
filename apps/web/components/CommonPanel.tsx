"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Scene, SceneAsset } from "@/types";
import { getStorageUrl } from "@/lib/api";

interface CommonPanelProps {
  onAddText?: () => void;
  onAddMedia?: () => void;
  onAddWatermark?: () => void;
  onAddShape?: () => void;
  onAddBackgroundAudio?: () => void;
  onAddEffects?: () => void;
  onClose?: () => void;
  // Search Assets props
  selectedSceneId?: string | null;
  scenes?: Scene[];
  onUpdateScene?: (id: string, updates: Partial<Scene>) => void;
  onAddAsset?: (type: "image" | "video" | "audio") => void;
  projectId?: string;
}

export default function CommonPanel({
  onAddText,
  onAddMedia,
  onAddWatermark,
  onAddShape,
  onAddBackgroundAudio,
  onAddEffects,
  onClose,
  selectedSceneId,
  scenes = [],
  onUpdateScene,
  onAddAsset,
  projectId,
}: CommonPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"image" | "video">("image");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    name: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [currentType, setCurrentType] = useState<"image" | "video">("image");
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  const loadMoreResults = useCallback(async () => {
    if (!currentQuery.trim() || !selectedSceneId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/assets/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: currentQuery,
            type: currentType,
            perPage: 10,
            page: nextPage,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults((prev) => [...prev, ...(data.results || [])]);
        setHasMore(data.hasMore || false);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error("Failed to load more assets:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentQuery, currentType, currentPage, hasMore, isLoadingMore, selectedSceneId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore || !observerTarget.current || !scrollContainerRef.current) {
      return;
    }

    let loading = false; // Prevent multiple simultaneous loads

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore && !loading && currentQuery) {
          loading = true;
          console.log('Intersection Observer: Loading more results...');
          loadMoreResults().finally(() => {
            loading = false;
          });
        }
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px',
        threshold: 0.1,
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    // Fallback: scroll event listener with debounce
    const scrollContainer = scrollContainerRef.current;
    let scrollTimeout: NodeJS.Timeout | null = null;
    
    const handleScroll = () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      scrollTimeout = setTimeout(() => {
        if (!hasMore || isLoadingMore || loading || !currentTarget || !scrollContainer || !currentQuery) return;
        
        const container = scrollContainer;
        const target = currentTarget;
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        
        // Check if target is visible or near the bottom
        const isNearBottom = targetRect.top <= containerRect.bottom + 200;
        
        if (isNearBottom) {
          loading = true;
          console.log('Scroll event: Loading more results...');
          loadMoreResults().finally(() => {
            loading = false;
          });
        }
      }, 100);
    };

    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreResults, currentQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedSceneId) return;

    setIsSearching(true);
    setCurrentQuery(searchQuery);
    setCurrentType(searchType);
    setCurrentPage(1);
    setSearchResults([]);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/assets/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            type: searchType,
            perPage: 10,
            page: 1,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Failed to search assets:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset when search type changes
  useEffect(() => {
    if (currentQuery && currentQuery === searchQuery) {
      // Re-search with new type if we have an active search
      const performSearch = async () => {
        setIsSearching(true);
        setCurrentType(searchType);
        setCurrentPage(1);
        setSearchResults([]);
        
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/assets/search`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: currentQuery,
                type: searchType,
                perPage: 10,
                page: 1,
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.results || []);
            setHasMore(data.hasMore || false);
          }
        } catch (error) {
          console.error("Failed to search assets:", error);
        } finally {
          setIsSearching(false);
        }
      };
      
      performSearch();
    }
  }, [searchType, currentQuery, searchQuery]);

  const handleAssetSelect = async (asset: { id: string; url: string; thumbnailUrl?: string; name: string }) => {
    if (!selectedSceneId || !onAddAsset || !onUpdateScene) return;

    // Add asset to scene with default animation
    const animations = ["fadeIn", "slideInLeft", "slideInRight", "zoomIn"];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)] as any;
    
    const newAsset: SceneAsset = {
      id: `asset_${Date.now()}`,
      type: searchType,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      name: asset.name,
      source: "pexels",
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: searchType === "audio" ? 0 : 1, // Audio files hidden by default
      volume: searchType === "video" ? 0 : undefined, // Mute videos by default
      zIndex: selectedScene?.assets?.length || 0,
      animationType: randomAnimation,
      animationDuration: 1,
      animationDelay: 0,
      animationEasing: "easeOut",
    };

    onUpdateScene(selectedSceneId, {
      assets: [...(selectedScene?.assets || []), newAsset],
    });
  };
  const commonItems = [
    {
      id: "text",
      label: "Text",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h7"
          />
        </svg>
      ),
      onClick: onAddText,
    },
    {
      id: "media",
      label: "Media",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      onClick: onAddMedia,
    },
    {
      id: "watermark",
      label: "Watermark",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      ),
      onClick: onAddWatermark,
    },
    {
      id: "shape",
      label: "Shape",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      onClick: onAddShape,
    },
    {
      id: "background-audio",
      label: "Background Audio",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
          />
        </svg>
      ),
      onClick: onAddBackgroundAudio,
    },
    {
      id: "effects",
      label: "Effects",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      onClick: onAddEffects,
    },
  ];

  return (
    <div className="w-full h-full bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Common</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
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

      {/* Grid of Common Items */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          {commonItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex flex-col items-center justify-center p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
            >
              <div className="text-gray-300 group-hover:text-white mb-1">
                {item.icon}
              </div>
              <span className="text-xs text-gray-400 group-hover:text-white text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Assets Section */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-shrink-0 p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-3 text-white">Search Assets</h3>

          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSearchType("image")}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                searchType === "image"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setSearchType("video")}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                searchType === "video"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Videos
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Pexels..."
              className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              disabled={!selectedSceneId || isSearching}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "..." : "Search"}
            </button>
          </div>

          {/* Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Upload Asset
            </label>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && selectedSceneId && onAddAsset && onUpdateScene) {
                  // TODO: Upload to backend and get URL
                  const url = URL.createObjectURL(file);
                  const fileType = file.type.startsWith("image/")
                    ? "image"
                    : file.type.startsWith("video/")
                    ? "video"
                    : "audio";

                  const newAsset: SceneAsset = {
                    id: `asset_${Date.now()}`,
                    type: fileType,
                    url: url,
                    name: file.name,
                    source: "upload",
                    x: 0,
                    y: 0,
                    scale: 1,
                    rotation: 0,
                    opacity: fileType === "audio" ? 0 : 1, // Audio files hidden by default
                    zIndex: selectedScene?.assets?.length || 0,
                  };

                  onUpdateScene(selectedSceneId, {
                    assets: [...(selectedScene?.assets || []), newAsset],
                  });
                }
              }}
            />
          </div>
        </div>

        {/* Search Results */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 min-h-0">
          {isSearching ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => handleAssetSelect(result)}
                    className="cursor-pointer border border-gray-700 rounded overflow-hidden hover:border-pink-500 transition-colors bg-gray-700 group"
                  >
                    {result.thumbnailUrl ? (
                      <div className="relative w-full aspect-video bg-gray-800">
                        <img
                          src={getStorageUrl(result.thumbnailUrl) || result.thumbnailUrl}
                          alt={result.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center">
                                  <span class="text-xs text-gray-400">${result.name}</span>
                                </div>
                              `;
                            }
                          }}
                        />
                        {searchType === "video" && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-opacity">
                            <svg
                              className="w-8 h-8 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-gray-700 flex items-center justify-center">
                        <span className="text-xs text-gray-400 text-center px-2">{result.name}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div 
                  ref={observerTarget} 
                  className="py-6 text-center min-h-[60px] flex items-center justify-center"
                >
                  {isLoadingMore ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-400">Loading more...</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Scroll for more results</p>
                  )}
                </div>
              )}
              
              {!hasMore && searchResults.length > 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No more results
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400 text-center px-4">
                {selectedSceneId
                  ? "Search for images or videos to add to your scene"
                  : "Select a scene to search for assets"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

