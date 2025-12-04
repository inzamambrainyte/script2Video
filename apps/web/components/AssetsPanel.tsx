"use client";

import { Scene, SceneAsset } from "@/types";
import { useState } from "react";
import { getStorageUrl } from "@/lib/api";

interface AssetsPanelProps {
  selectedSceneId: string | null;
  scenes: Scene[];
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onAddAsset?: (type: "image" | "video" | "audio") => void;
  projectId?: string;
}

export default function AssetsPanel({
  selectedSceneId,
  scenes,
  onUpdateScene,
  onAddAsset,
  projectId,
}: AssetsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"image" | "video">("image");
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    name: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedSceneId) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/v1/assets/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchQuery,
            type: searchType,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Failed to search assets:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAssetSelect = async (asset: { id: string; url: string; thumbnailUrl?: string; name: string }) => {
    if (!selectedSceneId || !onAddAsset) return;

    // Add asset to scene
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
      zIndex: selectedScene?.assets?.length || 0,
    };

    onUpdateScene(selectedSceneId, {
      assets: [...(selectedScene?.assets || []), newAsset],
    });
  };

  return (
    <div className="flex flex-col max-h-96 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-semibold mb-3 text-white">Search Assets</h2>

        {/* Search */}
        <div className="mb-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setSearchType("image")}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                searchType === "image"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setSearchType("video")}
              className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                searchType === "video"
                  ? "bg-primary-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              Videos
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search Pexels..."
              className="flex-1 px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Upload */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Upload Asset
          </label>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file && selectedSceneId && onAddAsset) {
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
      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <p className="text-sm text-gray-400 text-center py-8">Searching...</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {searchResults.map((result) => (
              <div
                key={result.id}
                onClick={() => handleAssetSelect(result)}
                className="cursor-pointer border border-gray-700 rounded overflow-hidden hover:border-primary-500 transition-colors"
              >
                {result.thumbnailUrl ? (
                  <img
                    src={getStorageUrl(result.thumbnailUrl) || result.thumbnailUrl}
                    alt={result.name}
                    className="w-full h-24 object-cover"
                  />
                ) : (
                  <div className="w-full h-24 bg-gray-700 flex items-center justify-center">
                    <span className="text-xs text-gray-400">{result.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            Search for images or videos to add to your scene
          </p>
        )}
      </div>
    </div>
  );
}
