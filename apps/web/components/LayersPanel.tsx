"use client";

import { Scene, SceneAsset } from "@/types";
import { useState } from "react";
import { getStorageUrl } from "@/lib/api";

interface LayersPanelProps {
  selectedScene: Scene | null;
  onUpdateAsset: (assetId: string, updates: Partial<SceneAsset>) => void;
  onDeleteAsset: (assetId: string) => void;
  onAddAsset: (type: "image" | "video" | "audio") => void;
  onSelectAsset: (assetId: string | null) => void;
  selectedAssetId: string | null;
  projectId?: string;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => void;
}

export default function LayersPanel({
  selectedScene,
  onUpdateAsset,
  onDeleteAsset,
  onAddAsset,
  onSelectAsset,
  selectedAssetId,
  projectId,
  onUpdateScene,
}: LayersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [voiceoverProvider, setVoiceoverProvider] = useState<
    "openai" | "elevenlabs"
  >("elevenlabs");
  const [openaiVoice, setOpenaiVoice] = useState<string>("alloy");
  const [elevenlabsVoiceId, setElevenlabsVoiceId] =
    useState<string>("eleven_en_us_v1");
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [autoAdjustDuration, setAutoAdjustDuration] = useState(true);

  if (!selectedScene) {
    return (
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <p className="text-sm text-gray-400 text-center">
          Select a scene to view layers
        </p>
      </div>
    );
  }

  // Sort assets by zIndex (layer order)
  const sortedAssets = [...(selectedScene.assets || [])].sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  const handleGenerateVoiceover = async () => {
    if (!selectedScene || !projectId || !onUpdateScene) return;

    setIsGeneratingVoiceover(true);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${projectId}/voiceover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneId: selectedScene.id,
            provider: voiceoverProvider,
            voiceId:
              voiceoverProvider === "openai" ? openaiVoice : elevenlabsVoiceId,
            model: voiceoverProvider === "openai" ? "tts-1" : undefined,
            autoAdjustDuration: autoAdjustDuration,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Create audio asset from voiceover
        const voiceoverAsset: SceneAsset = {
          id: `asset_${Date.now()}`,
          type: "audio",
          url: data.voiceUrl,
          name: `Voiceover (${voiceoverProvider})`,
          source: "generated",
          startTime: 0,
          volume: 1,
          opacity: 0, // Audio files hidden by default
          zIndex: selectedScene.assets?.length || 0,
        };

        // Update scene with voiceover and auto-adjusted duration
        onUpdateScene(selectedScene.id, {
          assets: [...(selectedScene.assets || []), voiceoverAsset],
          voiceUrl: data.voiceUrl, // Backward compatibility
          duration: data.sceneDuration || selectedScene.duration, // Use new duration if provided
        });

        if (data.duration && data.sceneDuration) {
          console.log(`✅ Scene duration updated to ${data.sceneDuration}s (voiceover: ${data.duration.toFixed(2)}s)`);
        }
      }
    } catch (error) {
      console.error("Failed to generate voiceover:", error);
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  return (
    <div className="w-full h-full bg-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Layers</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white"
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>

        {/* Add Asset Buttons */}
        {isExpanded && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => onAddAsset("image")}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              + Image
            </button>
            <button
              onClick={() => onAddAsset("video")}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              + Video
            </button>
            <button
              onClick={() => onAddAsset("audio")}
              className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
            >
              + Audio
            </button>
          </div>
        )}

        {/* Voiceover Generation */}
        {isExpanded && selectedScene && projectId && onUpdateScene && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <h3 className="text-sm font-semibold text-white mb-2">
              Generate Voiceover
            </h3>

            {/* Voiceover Provider Selection */}
            <div className="mb-2">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setVoiceoverProvider("openai")}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                    voiceoverProvider === "openai"
                      ? "bg-primary-600 border-primary-500 text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  OpenAI
                </button>
                <button
                  onClick={() => setVoiceoverProvider("elevenlabs")}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                    voiceoverProvider === "elevenlabs"
                      ? "bg-primary-600 border-primary-500 text-white"
                      : "bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  ElevenLabs
                </button>
              </div>

              {/* Voice Selection */}
              {voiceoverProvider === "openai" && (
                <select
                  value={openaiVoice}
                  onChange={(e) => setOpenaiVoice(e.target.value)}
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              )}

              {voiceoverProvider === "elevenlabs" && (
                <input
                  type="text"
                  value={elevenlabsVoiceId}
                  onChange={(e) => setElevenlabsVoiceId(e.target.value)}
                  placeholder="Voice ID (e.g., eleven_en_us_v1)"
                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500 mb-2"
                />
              )}
            </div>

            {/* Auto-adjust Duration Toggle */}
            <div className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-adjust-duration"
                checked={autoAdjustDuration}
                onChange={(e) => setAutoAdjustDuration(e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
              />
              <label
                htmlFor="auto-adjust-duration"
                className="text-xs text-gray-300 cursor-pointer"
              >
                Auto-adjust scene duration to match voiceover
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateVoiceover}
              disabled={isGeneratingVoiceover || !selectedScene.text.trim()}
              className="w-full px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingVoiceover ? "Generating..." : "Generate Voiceover"}
            </button>
            {selectedScene.voiceUrl && (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-green-400">✓ Voiceover generated</p>
                {selectedScene.duration && (
                  <p className="text-xs text-gray-400">
                    Scene duration: {selectedScene.duration}s
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generate Captions - Always visible when scene is selected */}
      {selectedScene && projectId && onUpdateScene && (
        <div className="p-4 border-b border-gray-700 bg-gray-750">
          <h3 className="text-sm font-semibold text-white mb-2">
            Generate Captions
          </h3>
          <button
            onClick={async () => {
              if (!selectedScene || !projectId || !onUpdateScene) return;

              setIsGeneratingCaptions(true);
              try {
                const response = await fetch(
                  `${
                    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
                  }/api/v1/projects/${projectId}/captions`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  }
                );

                if (response.ok) {
                  const data = await response.json();
                  // Find the caption URL for this scene
                  const sceneCaptionUrl = data.captions?.[selectedScene.id];
                  if (sceneCaptionUrl) {
                    onUpdateScene(selectedScene.id, {
                      captionsUrl: sceneCaptionUrl,
                    });
                  }
                }
              } catch (error) {
                console.error("Failed to generate captions:", error);
              } finally {
                setIsGeneratingCaptions(false);
              }
            }}
            disabled={isGeneratingCaptions}
            className="w-full px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingCaptions ? "Generating..." : "Generate Captions"}
          </button>
          {selectedScene.captionsUrl && (
            <p className="text-xs text-green-400 mt-1">✓ Captions generated</p>
          )}
        </div>
      )}

      {/* Layers List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {sortedAssets.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No assets. Add images, videos, or audio.
            </p>
          ) : (
            sortedAssets.map((asset, index) => (
              <div
                key={asset.id}
                onClick={() =>
                  onSelectAsset(selectedAssetId === asset.id ? null : asset.id)
                }
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedAssetId === asset.id
                    ? "border-primary-500 bg-primary-900/30"
                    : "border-gray-700 hover:border-gray-600 bg-gray-800/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-500">
                      {asset.type === "image"
                        ? "🖼️"
                        : asset.type === "video"
                        ? "🎥"
                        : "🔊"}
                    </span>
                    <span className="text-xs font-medium text-gray-300 truncate">
                      {asset.name || `Layer ${sortedAssets.length - index}`}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAsset(asset.id);
                    }}
                    className="text-red-400 hover:text-red-300 text-xs ml-2"
                  >
                    ×
                  </button>
                </div>

                {/* Thumbnail */}
                {(asset.type === "image" || asset.type === "video") &&
                  asset.thumbnailUrl && (
                    <div className="mb-2 rounded overflow-hidden">
                      <img
                        src={
                          getStorageUrl(asset.thumbnailUrl) ||
                          asset.thumbnailUrl
                        }
                        alt={asset.name}
                        className="w-full h-16 object-cover"
                      />
                    </div>
                  )}

                {/* Asset Info */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Type: {asset.type}</div>
                  {asset.source && <div>Source: {asset.source}</div>}
                  {asset.zIndex !== undefined && (
                    <div>Layer: {asset.zIndex}</div>
                  )}
                </div>

                {/* Quick Transform Info */}
                {selectedAssetId === asset.id &&
                  (asset.type === "image" || asset.type === "video") && (
                    <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-400">
                      <div>Scale: {(asset.scale || 1) * 100}%</div>
                      <div>Rotation: {asset.rotation || 0}°</div>
                      <div>
                        Opacity: {((asset.opacity || 1) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
