"use client";

import { Scene } from "@/types";
import { useState, useRef, useEffect } from "react";
import { getStorageUrl } from "@/lib/api";

interface ScenesPanelProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelectScene: (id: string) => void;
  onUpdateScene: (id: string, updates: Partial<Scene>) => void;
  onAddScene: () => void;
  onDeleteScene: (id: string) => void;
  onReorderScenes: (reorderedScenes: Scene[]) => void;
  onGenerateScript: () => void;
  onUpdateSceneScript?: (sceneId: string, newText: string) => void;
  onRegenerateVoiceover?: (sceneId: string) => void;
  isGenerating: boolean;
  isGeneratingVoiceover?: string | null; // sceneId that's currently generating
}

export default function ScenesPanel({
  scenes,
  selectedSceneId,
  onSelectScene,
  onUpdateScene,
  onAddScene,
  onDeleteScene,
  onReorderScenes,
  onGenerateScript,
  onUpdateSceneScript,
  onRegenerateVoiceover,
  isGenerating,
  isGeneratingVoiceover = null,
}: ScenesPanelProps) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const menuRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current.get(openMenuId);
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  const handleDragStart = (e: React.DragEvent, sceneId: string) => {
    setDraggedSceneId(sceneId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sceneId);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedSceneId) return;

    const draggedIndex = scenes.findIndex((s) => s.id === draggedSceneId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedSceneId(null);
      return;
    }

    // Reorder scenes
    const newScenes = [...scenes];
    const [removed] = newScenes.splice(draggedIndex, 1);
    newScenes.splice(dropIndex, 0, removed);

    // Update order and call callback
    onReorderScenes(newScenes);
    setDraggedSceneId(null);
  };

  const handleDragEnd = () => {
    setDraggedSceneId(null);
    setDragOverIndex(null);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold mb-3 text-white">Scenes</h2>
        <button
          onClick={onGenerateScript}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed mb-2 transition-colors font-medium"
        >
          {isGenerating ? "Generating..." : "Generate Script"}
        </button>
        <button
          onClick={onAddScene}
          className="w-full px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
        >
          + Add Scene
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {scenes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            No scenes yet. Click "Generate Script" or "Add Scene" to get
            started.
          </p>
        ) : (
          scenes.map((scene, index) => {
            // Get thumbnail from first image/video asset
            const thumbnailAsset = scene.assets?.find(
              (a) => a.type === "image" || a.type === "video"
            );
            const thumbnailUrl = thumbnailAsset
              ? getStorageUrl(
                  thumbnailAsset.thumbnailUrl || thumbnailAsset.url
                ) ||
                thumbnailAsset.thumbnailUrl ||
                thumbnailAsset.url
              : scene.mediaUrl
              ? getStorageUrl(scene.mediaUrl) || scene.mediaUrl
              : null;

            // Get speaker/voice info (could be from voiceover asset or scene metadata)
            const voiceoverAsset = scene.assets?.find(
              (a) => a.type === "audio"
            );
            const speakerName = "Marcus"; // Default or from scene metadata

            // Format duration
            const formatDuration = (seconds: number) => {
              if (seconds >= 60) {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins}min ${secs.toFixed(2)}s`;
              }
              return `${seconds.toFixed(2)}s`;
            };

            return (
              <div
                key={scene.id}
                draggable
                onDragStart={(e) => handleDragStart(e, scene.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onSelectScene(scene.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-all bg-gray-800/50 ${
                  selectedSceneId === scene.id
                    ? "border-pink-500 bg-pink-900/20"
                    : "border-gray-700 hover:border-gray-600"
                } ${draggedSceneId === scene.id ? "opacity-50" : ""} ${
                  dragOverIndex === index && draggedSceneId !== scene.id
                    ? "border-pink-400 border-2 border-dashed"
                    : ""
                }`}
              >
                {/* Header: Play icon, Scene number, and Action icons */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectScene(scene.id);
                      }}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium text-white">
                      Scene {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
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
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    <div
                      className="relative"
                      ref={(el) => {
                        if (el) {
                          menuRefs.current.set(scene.id, el);
                        } else {
                          menuRefs.current.delete(scene.id);
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === scene.id ? null : scene.id
                          );
                        }}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Scene options"
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
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === scene.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSceneId(scene.id);
                              setEditingText(scene.text || "");
                              setOpenMenuId(null);
                              // Focus textarea after state update
                              setTimeout(() => {
                                const textarea = textareaRefs.current.get(
                                  scene.id
                                );
                                if (textarea) {
                                  textarea.focus();
                                  textarea.select();
                                }
                              }, 0);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Update Script
                          </button>
                          {scene.text && scene.text.trim() !== "" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRegenerateVoiceover) {
                                  onRegenerateVoiceover(scene.id);
                                }
                                setOpenMenuId(null);
                              }}
                              disabled={isGeneratingVoiceover === scene.id}
                              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 border-t border-gray-700"
                            >
                              {isGeneratingVoiceover === scene.id ? (
                                <>
                                  <svg
                                    className="w-4 h-4 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    ></circle>
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                  </svg>
                                  Generating...
                                </>
                              ) : (
                                <>
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
                                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                    />
                                  </svg>
                                  Regenerate Voiceover
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScene(scene.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300 transition-colors"
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
                  </div>
                </div>

                {/* Content: Text and Thumbnail */}
                <div className="flex gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    {editingSceneId === scene.id ? (
                      <div className="space-y-2">
                        <textarea
                          ref={(el) => {
                            if (el) {
                              textareaRefs.current.set(scene.id, el);
                            } else {
                              textareaRefs.current.delete(scene.id);
                            }
                          }}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingSceneId(null);
                              setEditingText("");
                            } else if (
                              e.key === "Enter" &&
                              (e.ctrlKey || e.metaKey)
                            ) {
                              // Ctrl/Cmd + Enter to save
                              e.preventDefault();
                              if (onUpdateSceneScript && editingText.trim()) {
                                onUpdateSceneScript(
                                  scene.id,
                                  editingText.trim()
                                );
                                setEditingSceneId(null);
                                setEditingText("");
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                          rows={4}
                          placeholder="Enter scene script..."
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateSceneScript && editingText.trim()) {
                                onUpdateSceneScript(
                                  scene.id,
                                  editingText.trim()
                                );
                                setEditingSceneId(null);
                                setEditingText("");
                              }
                            }}
                            className="px-3 py-1 bg-pink-500 text-white text-xs rounded hover:bg-pink-600 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSceneId(null);
                              setEditingText("");
                            }}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <span className="text-xs text-gray-400">
                            Ctrl/Cmd + Enter to save
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-300 line-clamp-4">
                        {scene.text || "No text content..."}
                      </p>
                    )}
                  </div>
                  {thumbnailUrl && (
                    <div className="w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-700">
                      <img
                        src={thumbnailUrl}
                        alt="Scene thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Footer: Speaker and Duration */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
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
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                    <span>{speakerName}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDuration(scene.duration)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
