"use client";

import { Scene, SceneAsset } from "@/types";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { getStorageUrl } from "@/lib/api";
import WordHighlightedCaptions from "./WordHighlightedCaptions";
import {
  calculateAnimationTransform,
  getDefaultAnimation,
} from "@/lib/animations";

interface CanvasPreviewProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  selectedAssetId?: string | null;
  onSelectAsset?: (assetId: string | null) => void;
  onSelectCaption?: (selected: boolean) => void;
  isCaptionSelected?: boolean;
}

export default function CanvasPreview({
  scenes,
  selectedSceneId,
  selectedAssetId,
  onSelectAsset,
  onSelectCaption,
  isCaptionSelected = false,
}: CanvasPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [captionText, setCaptionText] = useState<string | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const previewTimerRef = useRef<number | null>(null); // For preview without audio
  const previewStartTimeRef = useRef<number | null>(null); // Track when preview started

  const selectedScene = scenes.find((s) => s.id === selectedSceneId);
  const totalFrames = scenes.reduce((sum, s) => sum + s.duration * 30, 0); // 30 fps
  const sceneDuration = selectedScene?.duration || 0;

  // Find the voiceover audio asset
  const voiceoverAsset = selectedScene?.assets?.find((a) => a.type === "audio");
  const voiceoverUrl = voiceoverAsset
    ? getStorageUrl(voiceoverAsset.url) || voiceoverAsset.url
    : selectedScene?.voiceUrl
    ? getStorageUrl(selectedScene.voiceUrl) || selectedScene.voiceUrl
    : null;

  // Track audio playback time and sync videos (when audio exists)
  useEffect(() => {
    if (!audioRef.current || !voiceoverUrl) return;

    const audio = audioRef.current;

    const updateTime = () => {
      setAudioCurrentTime(audio.currentTime);
      // Sync all videos with audio playback time
      videoRefs.current.forEach((video) => {
        if (video && Math.abs(video.currentTime - audio.currentTime) > 0.1) {
          video.currentTime = audio.currentTime;
        }
      });
    };

    const handlePlay = () => {
      setIsPlaying(true);
      // Play all videos when audio plays
      videoRefs.current.forEach((video) => {
        if (video) {
          video.play().catch((err) => {
            console.warn("Failed to play video:", err);
          });
        }
      });
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Pause all videos when audio pauses
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setAudioCurrentTime(0);
      // Reset all videos
      videoRefs.current.forEach((video) => {
        if (video) {
          video.currentTime = 0;
          video.pause();
        }
      });
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [voiceoverUrl]);

  // Preview timer for scenes without audio (visual-only preview)
  useEffect(() => {
    if (!voiceoverUrl && isPlaying && selectedScene) {
      // Start timer-based preview from current time
      if (previewStartTimeRef.current === null) {
        previewStartTimeRef.current = Date.now() - audioCurrentTime * 1000;
      }

      const updatePreview = () => {
        if (previewStartTimeRef.current === null) return;
        const elapsed = (Date.now() - previewStartTimeRef.current) / 1000;
        if (elapsed >= sceneDuration) {
          // Scene ended
          setIsPlaying(false);
          setAudioCurrentTime(0);
          // Reset all videos
          videoRefs.current.forEach((video) => {
            if (video) {
              video.currentTime = 0;
              video.pause();
            }
          });
          if (previewTimerRef.current) {
            cancelAnimationFrame(previewTimerRef.current);
            previewTimerRef.current = null;
          }
          return;
        }

        setAudioCurrentTime(elapsed);

        // Sync videos with preview time
        videoRefs.current.forEach((video) => {
          if (video) {
            const videoDuration = video.duration || sceneDuration;
            const videoTime = elapsed % videoDuration;
            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
            }
            if (video.paused) {
              video.play().catch((err) => {
                console.warn("Failed to play video:", err);
              });
            }
          }
        });

        previewTimerRef.current = requestAnimationFrame(updatePreview);
      };

      previewTimerRef.current = requestAnimationFrame(updatePreview);

      // Play all videos
      videoRefs.current.forEach((video) => {
        if (video) {
          video.play().catch((err) => {
            console.warn("Failed to play video:", err);
          });
        }
      });

      return () => {
        if (previewTimerRef.current) {
          cancelAnimationFrame(previewTimerRef.current);
          previewTimerRef.current = null;
        }
      };
    } else if (!isPlaying) {
      // Stop preview timer when paused
      if (previewTimerRef.current) {
        cancelAnimationFrame(previewTimerRef.current);
        previewTimerRef.current = null;
      }
      previewStartTimeRef.current = null;

      // Pause all videos
      videoRefs.current.forEach((video) => {
        if (video) {
          video.pause();
        }
      });
    }
  }, [
    isPlaying,
    voiceoverUrl,
    selectedScene?.id,
    sceneDuration,
    audioCurrentTime,
  ]);

  // Load caption text when scene changes
  React.useEffect(() => {
    if (selectedScene?.captionsUrl) {
      const captionUrl =
        getStorageUrl(selectedScene.captionsUrl) || selectedScene.captionsUrl;
      fetch(captionUrl)
        .then((res) => res.text())
        .then((text) => {
          // Parse SRT format - extract ALL caption text
          const lines = text.split("\n");
          let allCaptionText: string[] = [];
          let inCaption = false;
          let currentCaption: string[] = [];

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine.match(/^\d+$/)) {
              // Sequence number - start of new caption
              if (currentCaption.length > 0) {
                allCaptionText.push(currentCaption.join(" "));
              }
              inCaption = true;
              currentCaption = [];
            } else if (trimmedLine.match(/^\d{2}:\d{2}:\d{2}/)) {
              // Timecode line - continue
              continue;
            } else if (trimmedLine === "" && inCaption) {
              // End of caption block
              if (currentCaption.length > 0) {
                allCaptionText.push(currentCaption.join(" "));
                currentCaption = [];
              }
              inCaption = false;
            } else if (inCaption && trimmedLine) {
              // Caption text line
              currentCaption.push(trimmedLine);
            }
          }

          // Add last caption if exists
          if (currentCaption.length > 0) {
            allCaptionText.push(currentCaption.join(" "));
          }

          // Join all captions with spaces
          const fullText =
            allCaptionText.length > 0
              ? allCaptionText.join(" ")
              : selectedScene.text;

          setCaptionText(fullText);
        })
        .catch(() => {
          // Fallback to scene text if caption file can't be loaded
          setCaptionText(selectedScene.text);
        });
    } else {
      // Use scene text as caption if no caption file
      setCaptionText(selectedScene?.text || null);
    }
  }, [selectedScene?.id, selectedScene?.captionsUrl, selectedScene?.text]);

  // Sort assets by zIndex for proper layering
  // Filter out audio assets for visual rendering (audio is handled separately)
  const sortedAssets =
    selectedScene?.assets
      ?.filter((a) => a.type !== "audio")
      ?.slice()
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)) || [];

  // Debug: Log assets to console for troubleshooting
  useEffect(() => {
    if (selectedScene) {
      console.log("🎬 Selected Scene:", {
        id: selectedScene.id,
        text: selectedScene.text,
        totalAssets: selectedScene.assets?.length || 0,
        visualAssets: sortedAssets.length,
        assets: selectedScene.assets,
        sortedAssets: sortedAssets,
      });
    }
  }, [selectedScene?.id, selectedScene?.assets?.length, sortedAssets.length]);

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-black rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
        {selectedScene ? (
          <div
            className="w-full h-full relative"
            onClick={(e) => {
              // Deselect captions if clicking on the canvas background (not on captions)
              if (e.target === e.currentTarget) {
                onSelectCaption?.(false);
              }
            }}
          >
            {/* Render all assets with transforms */}
            {sortedAssets.length > 0 ? (
              sortedAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                const assetUrl = getStorageUrl(asset.url) || asset.url;

                // Debug: Log each asset being rendered
                console.log("🎨 Rendering asset in canvas:", {
                  id: asset.id,
                  type: asset.type,
                  name: asset.name,
                  url: assetUrl,
                  x: asset.x,
                  y: asset.y,
                  width: asset.width,
                  height: asset.height,
                  opacity: asset.opacity,
                  zIndex: asset.zIndex,
                });

                // Calculate animation transform based on current playback time
                // If not playing, show assets at full opacity (for preview)
                const previewTime = isPlaying
                  ? audioCurrentTime
                  : Math.max(audioCurrentTime, 1); // Show after animation completes if not playing
                const animTransform = calculateAnimationTransform(
                  asset,
                  previewTime,
                  sceneDuration
                );

                // Ensure assets are visible when not playing (preview mode)
                // When playing, use animation opacity; when not playing, show at full opacity
                const finalOpacity = isPlaying
                  ? animTransform.opacity
                  : Math.max(animTransform.opacity, 1);

                // Calculate transform styles with animation
                // For videos, ensure they have proper dimensions
                const defaultWidth = asset.type === "video" ? 100 : undefined;
                const defaultHeight = asset.type === "video" ? 100 : undefined;

                const transformStyle: React.CSSProperties = {
                  position: "absolute",
                  left: `${animTransform.x}%`,
                  top: `${animTransform.y}%`,
                  width: asset.width
                    ? `${asset.width}%`
                    : defaultWidth
                    ? `${defaultWidth}%`
                    : "auto",
                  height: asset.height
                    ? `${asset.height}%`
                    : defaultHeight
                    ? `${defaultHeight}%`
                    : "auto",
                  transform: `scale(${animTransform.scale}) rotate(${animTransform.rotation}deg)`,
                  opacity: finalOpacity,
                  border: isSelected ? "2px solid #0ea5e9" : "none",
                  cursor: onSelectAsset ? "pointer" : "default",
                  zIndex: asset.zIndex || 0,
                  transition:
                    asset.animationType && asset.animationType !== "none"
                      ? "transform 0.1s linear, opacity 0.1s linear"
                      : "none", // Smooth animation updates
                };

                return (
                  <div
                    key={asset.id}
                    style={{
                      ...transformStyle,
                      ...(asset.type === "video"
                        ? { width: "100%", height: "100%" }
                        : {}),
                      // Ensure container is visible and clickable
                      pointerEvents: "auto",
                      overflow: "hidden",
                    }}
                    onClick={() => onSelectAsset?.(asset.id)}
                    className={
                      asset.type === "video" ? "w-full h-full" : "w-full h-full"
                    }
                  >
                    {asset.type === "image" && (
                      <img
                        src={assetUrl}
                        alt={asset.name}
                        className="w-full h-full object-contain"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100%",
                        }}
                        draggable={false}
                        onError={(e) => {
                          console.error(
                            "❌ Image load error:",
                            assetUrl,
                            asset
                          );
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                        onLoad={() => {
                          console.log("✅ Image loaded:", asset.name, assetUrl);
                        }}
                      />
                    )}
                    {asset.type === "video" && (
                      <video
                        ref={(el) => {
                          if (el) {
                            videoRefs.current.set(asset.id, el);
                            // Set volume based on asset property
                            if (asset.volume !== undefined) {
                              el.volume = asset.volume;
                              el.muted = asset.volume === 0;
                            } else {
                              // Default to muted for videos
                              el.volume = 0;
                              el.muted = true;
                            }
                          } else {
                            videoRefs.current.delete(asset.id);
                          }
                        }}
                        src={assetUrl}
                        className="w-full h-full object-cover"
                        style={{
                          display: "block",
                          minWidth: "100%",
                          minHeight: "100%",
                        }}
                        controls={false}
                        muted={asset.volume === 0 || asset.volume === undefined}
                        loop
                        playsInline
                        autoPlay={isPlaying}
                        crossOrigin="anonymous"
                        draggable={false}
                        onError={(e) => {
                          console.error("Video load error:", e, assetUrl);
                          const target = e.target as HTMLVideoElement;
                          // Show error message
                          if (target.parentElement) {
                            const errorDiv = document.createElement("div");
                            errorDiv.className =
                              "absolute inset-0 flex items-center justify-center bg-red-900/50 text-white text-xs p-2";
                            errorDiv.textContent = "Video failed to load";
                            target.parentElement.appendChild(errorDiv);
                          }
                        }}
                        onLoadedMetadata={() => {
                          // Sync video with audio when metadata loads
                          const video = videoRefs.current.get(asset.id);
                          if (video && audioRef.current) {
                            video.currentTime = audioRef.current.currentTime;
                          }
                          console.log("Video loaded:", asset.name, assetUrl);
                        }}
                        onLoadStart={() => {
                          console.log(
                            "Video loading started:",
                            asset.name,
                            assetUrl
                          );
                        }}
                      />
                    )}
                    {asset.type === "audio" && (
                      <div
                        className="bg-gray-700 p-4 rounded text-white text-sm"
                        style={{ opacity: asset.opacity ?? 0 }}
                      >
                        🔊 {asset.name}
                        <audio
                          ref={
                            asset.id === voiceoverAsset?.id
                              ? audioRef
                              : undefined
                          }
                          src={assetUrl}
                          controls
                          className="mt-2 w-full"
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Fallback: Show legacy mediaUrl if no assets
              <>
                {selectedScene.mediaUrl ? (
                  <img
                    src={
                      getStorageUrl(selectedScene.mediaUrl) ||
                      selectedScene.mediaUrl
                    }
                    alt="Scene preview"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-white text-lg text-center p-8">
                    {selectedScene.text}
                  </div>
                )}
              </>
            )}

            {/* Show scene text overlay if no visual assets */}
            {/* Only show if there are truly no visual assets */}
            {sortedAssets.length === 0 && !selectedScene.mediaUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="text-white text-lg text-center p-8 bg-black/50 rounded">
                  {selectedScene.text}
                </div>
              </div>
            )}

            {/* Voiceover audio (hidden, used for timing) */}
            {voiceoverUrl && (
              <audio
                ref={audioRef}
                src={voiceoverUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="hidden"
              />
            )}

            {/* Legacy voiceover audio (visible controls) */}
            {selectedScene.voiceUrl && !voiceoverAsset && (
              <div className="absolute bottom-4 left-4 right-4">
                <audio
                  ref={audioRef}
                  src={
                    getStorageUrl(selectedScene.voiceUrl) ||
                    selectedScene.voiceUrl
                  }
                  controls
                  className="w-full"
                />
              </div>
            )}

            {/* Word-Highlighted Captions */}
            {showCaptions && captionText && voiceoverUrl && (
              <WordHighlightedCaptions
                captionText={captionText}
                audioUrl={voiceoverUrl}
                isPlaying={isPlaying}
                currentTime={audioCurrentTime}
                duration={selectedScene.duration}
                style={selectedScene.captionStyle}
                onClick={() => onSelectCaption?.(true)}
                isSelected={isCaptionSelected}
              />
            )}

            {/* Fallback: Static Captions (if no audio) */}
            {showCaptions && captionText && !voiceoverUrl && (
              <WordHighlightedCaptions
                captionText={captionText}
                audioUrl={null}
                isPlaying={false}
                currentTime={0}
                duration={selectedScene.duration}
                style={selectedScene.captionStyle}
                onClick={() => onSelectCaption?.(true)}
                isSelected={isCaptionSelected}
              />
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-center">
            <p className="text-lg mb-2">No scene selected</p>
            <p className="text-sm">
              Select a scene from the left panel to preview
            </p>
          </div>
        )}
      </div>

      {/* Audio Controls & Scrubber - Fliki Style */}
      <div className="mt-6">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            onClick={() => {
              if (voiceoverUrl && audioRef.current) {
                // Play/pause audio if available
                if (isPlaying) {
                  audioRef.current.pause();
                } else {
                  audioRef.current.play().catch((err) => {
                    console.error("Failed to play audio:", err);
                  });
                }
              } else {
                // Toggle preview mode (visual-only, no audio)
                if (isPlaying) {
                  setIsPlaying(false);
                  setAudioCurrentTime(0);
                } else {
                  setIsPlaying(true);
                  setAudioCurrentTime(0);
                }
              }
            }}
            disabled={!selectedScene}
            className="w-10 h-10 flex items-center justify-center bg-gray-700 text-white rounded-full hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 ml-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </button>

          {/* Time Display */}
          <span className="text-sm text-gray-300 font-mono min-w-[80px]">
            {(() => {
              const formatTime = (seconds: number) => {
                const mins = Math.floor(seconds / 60);
                const secs = Math.floor(seconds % 60);
                return `${mins.toString().padStart(2, "0")}:${secs
                  .toString()
                  .padStart(2, "0")}`;
              };

              if (voiceoverUrl && audioRef.current) {
                const current = formatTime(audioCurrentTime);
                const total = formatTime(
                  audioRef.current.duration || selectedScene?.duration || 0
                );
                return `${current} / ${total}`;
              } else {
                const current = formatTime(currentFrame / 30);
                const total = formatTime(totalFrames / 30);
                return `${current} / ${total}`;
              }
            })()}
          </span>

          {/* Progress Bar */}
          <div
            className="flex-1 bg-gray-700 rounded-full h-1.5 relative cursor-pointer group"
            onClick={(e) => {
              if (!audioRef.current || !voiceoverUrl) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = x / rect.width;
              const newTime =
                percentage *
                (audioRef.current.duration || selectedScene?.duration || 0);
              audioRef.current.currentTime = newTime;
              setAudioCurrentTime(newTime);
            }}
          >
            <div
              className="bg-pink-500 h-1.5 rounded-full transition-all group-hover:bg-pink-600"
              style={{
                width:
                  voiceoverUrl && audioRef.current
                    ? `${
                        (audioCurrentTime /
                          (audioRef.current.duration ||
                            selectedScene?.duration ||
                            1)) *
                        100
                      }%`
                    : `${(currentFrame / totalFrames) * 100}%`,
              }}
            />
          </div>

          {/* Share and Fullscreen Icons */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Share"
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
            </button>
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Fullscreen"
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
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>Preview (low-res). Full render will be 1920x1080</p>
      </div>
    </div>
  );
}
