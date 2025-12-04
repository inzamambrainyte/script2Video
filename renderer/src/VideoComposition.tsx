import React, { useState, useEffect } from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Img,
  Video,
  delayRender,
  continueRender,
} from "remotion";

export interface SceneAsset {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  thumbnailUrl?: string;
  name: string;
  source: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  volume?: number;
  animationType?: string;
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
}

export interface CaptionStyle {
  position?: "top" | "bottom" | "center" | "custom";
  x?: number;
  y?: number;
  fontSize?: number;
  maxWidth?: number;
  padding?: number;
  textAlign?: "left" | "center" | "right";
  backgroundColor?: string;
  backgroundOpacity?: number;
  textColor?: string;
  fontWeight?: string | number;
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  scale?: number;
  opacity?: number;
  shadow?: boolean;
  blur?: number;
}

export interface Scene {
  id: string;
  text: string;
  duration: number; // seconds
  assets?: SceneAsset[];
  mediaUrl: string | null; // Backward compatibility
  voiceUrl: string | null;
  captionsUrl: string | null;
  captionStyle?: CaptionStyle;
  sfxUrls: string[];
  transition?: string;
}

interface VideoCompositionProps {
  scenes: Scene[];
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  scenes,
}) => {
  const { fps } = useVideoConfig();
  const currentFrame = useCurrentFrame();

  // Calculate total duration
  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const totalFrames = totalDuration * fps;

  // Calculate frame ranges for each scene
  let currentFrameStart = 0;
  const sceneRanges = scenes.map((scene) => {
    const sceneFrames = scene.duration * fps;
    const range = {
      scene,
      startFrame: currentFrameStart,
      endFrame: currentFrameStart + sceneFrames - 1,
    };
    currentFrameStart += sceneFrames;
    return range;
  });

  // Find current scene
  const currentSceneRange = sceneRanges.find(
    (range) =>
      currentFrame >= range.startFrame && currentFrame <= range.endFrame
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {sceneRanges.map((range, index) => {
        const { scene, startFrame, endFrame } = range;
        const isActive = currentFrame >= startFrame && currentFrame <= endFrame;

        return (
          <Sequence
            key={scene.id}
            from={startFrame}
            durationInFrames={endFrame - startFrame + 1}
          >
            <SceneComponent scene={scene} isActive={isActive} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

interface SceneComponentProps {
  scene: Scene;
  isActive: boolean;
}

const SceneComponent: React.FC<SceneComponentProps> = ({ scene, isActive }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const sceneFrame = frame % (scene.duration * fps);
  const currentTime = sceneFrame / fps;

  // Calculate animation transform
  const calculateAnimationTransform = (
    asset: SceneAsset,
    time: number,
    duration: number
  ) => {
    const animType = asset.animationType || "fadeIn";
    const animDuration = asset.animationDuration || 1;
    const animDelay = asset.animationDelay || 0;
    const easing = asset.animationEasing || "easeOut";

    const animStart = animDelay;
    const animEnd = animStart + animDuration;
    let progress = 0;

    if (time < animStart) {
      progress = 0;
    } else if (time >= animEnd) {
      progress = 1;
    } else {
      progress = (time - animStart) / animDuration;
    }

    // Apply easing
    if (easing === "easeIn") {
      progress = progress * progress;
    } else if (easing === "easeOut") {
      progress = 1 - (1 - progress) * (1 - progress);
    } else if (easing === "easeInOut") {
      progress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    }

    const baseX = asset.x || 0;
    const baseY = asset.y || 0;
    const baseScale = asset.scale || 1;
    const baseRotation = asset.rotation || 0;
    const baseOpacity = asset.opacity ?? 1;

    let x = baseX;
    let y = baseY;
    let scale = baseScale;
    let rotation = baseRotation;
    let opacity = baseOpacity;

    switch (animType) {
      case "fadeIn":
        opacity = baseOpacity * progress;
        break;
      case "slideInLeft":
        x = baseX - 100 * (1 - progress);
        opacity = baseOpacity * progress;
        break;
      case "slideInRight":
        x = baseX + 100 * (1 - progress);
        opacity = baseOpacity * progress;
        break;
      case "slideInTop":
        y = baseY - 100 * (1 - progress);
        opacity = baseOpacity * progress;
        break;
      case "slideInBottom":
        y = baseY + 100 * (1 - progress);
        opacity = baseOpacity * progress;
        break;
      case "zoomIn":
        scale = baseScale * (0.5 + 0.5 * progress);
        opacity = baseOpacity * progress;
        break;
      case "zoomOut":
        scale = baseScale * (1.5 - 0.5 * progress);
        opacity = baseOpacity * progress;
        break;
      case "rotateIn":
        rotation = baseRotation + 360 * (1 - progress);
        opacity = baseOpacity * progress;
        break;
      case "kenBurns":
        const kenBurnsProgress = Math.min(1, time / duration);
        scale = baseScale * (1 + 0.2 * kenBurnsProgress);
        x = baseX - 5 * kenBurnsProgress;
        y = baseY - 5 * kenBurnsProgress;
        break;
    }

    return { x, y, scale, rotation, opacity };
  };

  // Sort assets by zIndex
  const sortedAssets = (scene.assets || []).sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  return (
    <AbsoluteFill>
      {/* Render assets (backward compatibility: use mediaUrl if no assets) */}
      {sortedAssets.length > 0 ? (
        sortedAssets.map((asset) => {
          const animTransform = calculateAnimationTransform(
            asset,
            currentTime,
            scene.duration
          );

          return (
            <AbsoluteFill
              key={asset.id}
              style={{
                left: `${animTransform.x}%`,
                top: `${animTransform.y}%`,
                width: asset.width ? `${asset.width}%` : "100%",
                height: asset.height ? `${asset.height}%` : "100%",
                transform: `scale(${animTransform.scale}) rotate(${animTransform.rotation}deg)`,
                opacity: animTransform.opacity,
                zIndex: asset.zIndex || 0,
              }}
            >
              {asset.type === "image" && (
                <ImageWithErrorHandling src={asset.url} />
              )}
              {asset.type === "video" && (
                <Video
                  src={asset.url}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  startFrom={0}
                  volume={asset.volume !== undefined ? asset.volume : 0}
                  muted={asset.volume === 0 || asset.volume === undefined}
                />
              )}
            </AbsoluteFill>
          );
        })
      ) : scene.mediaUrl ? (
        // Backward compatibility: use mediaUrl if no assets
        <AbsoluteFill>
          {scene.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
            <Video
              src={scene.mediaUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              volume={0}
              muted={true}
            />
          ) : (
            <ImageWithErrorHandling src={scene.mediaUrl} />
          )}
        </AbsoluteFill>
      ) : null}

      {/* Voiceover Audio */}
      {scene.voiceUrl && <Audio src={scene.voiceUrl} startFrom={0} />}

      {/* SFX */}
      {scene.sfxUrls.map((sfxUrl, index) => (
        <Audio key={index} src={sfxUrl} startFrom={0} />
      ))}

      {/* Captions with SRT parsing and word highlighting */}
      {(scene.captionsUrl || scene.text) && (
        <CaptionComponent
          captionsUrl={scene.captionsUrl || ""}
          sceneText={scene.text}
          currentTime={currentTime}
          sceneDuration={scene.duration}
          style={scene.captionStyle || {}}
        />
      )}
    </AbsoluteFill>
  );
};

// Caption component with SRT parsing and word highlighting
interface CaptionComponentProps {
  captionsUrl: string;
  sceneText: string;
  currentTime: number;
  sceneDuration: number;
  style: CaptionStyle;
}

const CaptionComponent: React.FC<CaptionComponentProps> = ({
  captionsUrl,
  sceneText,
  currentTime,
  sceneDuration,
  style,
}) => {
  const [srtData, setSrtData] = useState<
    Array<{ start: number; end: number; text: string }>
  >([]);
  const [currentCaption, setCurrentCaption] = useState<string>("");
  const [words, setWords] = useState<
    Array<{ text: string; start: number; end: number; entryIndex: number }>
  >([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const handleId = React.useRef<number | null>(null);

  // Fetch and parse SRT file
  useEffect(() => {
    if (!captionsUrl) {
      setSrtData([]);
      setWords([]);
      setCurrentCaption("");
      return;
    }

    handleId.current = delayRender(`Loading captions: ${captionsUrl}`);

    // Try to fetch with CORS handling
    fetch(captionsUrl, {
      mode: "cors",
      credentials: "omit",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.text();
      })
      .then((text) => {
        // Parse SRT format
        const entries: Array<{ start: number; end: number; text: string }> = [];
        const blocks = text.trim().split(/\n\s*\n/);

        for (const block of blocks) {
          const lines = block.trim().split("\n");
          if (lines.length < 3) continue;

          // Parse timecode (format: 00:00:00,000 --> 00:00:00,000)
          const timecodeLine = lines[1];
          const timecodeMatch = timecodeLine.match(
            /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
          );

          if (timecodeMatch) {
            const startHours = parseInt(timecodeMatch[1]);
            const startMins = parseInt(timecodeMatch[2]);
            const startSecs = parseInt(timecodeMatch[3]);
            const startMillis = parseInt(timecodeMatch[4]);
            const startTime =
              startHours * 3600 +
              startMins * 60 +
              startSecs +
              startMillis / 1000;

            const endHours = parseInt(timecodeMatch[5]);
            const endMins = parseInt(timecodeMatch[6]);
            const endSecs = parseInt(timecodeMatch[7]);
            const endMillis = parseInt(timecodeMatch[8]);
            const endTime =
              endHours * 3600 + endMins * 60 + endSecs + endMillis / 1000;

            // Get caption text (lines after timecode)
            const captionText = lines.slice(2).join(" ").trim();

            if (captionText) {
              entries.push({
                start: startTime,
                end: endTime,
                text: captionText,
              });
            }
          }
        }

        setSrtData(entries);

        // Parse words with timing from SRT entries
        // Distribute time evenly across words in each entry
        const wordTimings: Array<{
          text: string;
          start: number;
          end: number;
          entryIndex: number;
        }> = [];
        entries.forEach((entry, entryIndex) => {
          const entryWords = entry.text.split(/(\s+)/);
          const actualWords = entryWords.filter((w) => w.trim().length > 0);
          const wordCount = actualWords.length;
          const timePerWord =
            wordCount > 0 ? (entry.end - entry.start) / wordCount : 0.1;

          let wordTime = entry.start;
          entryWords.forEach((word) => {
            if (word.trim().length > 0) {
              wordTimings.push({
                text: word,
                start: wordTime,
                end: wordTime + timePerWord,
                entryIndex,
              });
              wordTime += timePerWord;
            } else {
              // Preserve whitespace with minimal time
              wordTimings.push({
                text: word,
                start: wordTime,
                end: wordTime + 0.05,
                entryIndex,
              });
            }
          });
        });

        setWords(wordTimings);

        if (handleId.current) {
          continueRender(handleId.current);
          handleId.current = null;
        }
      })
      .catch((error) => {
        console.error("Failed to load captions:", error);
        // Fallback: use scene text without word highlighting
        setSrtData([]);
        setWords([]);
        setCurrentCaption(sceneText);
        if (handleId.current) {
          continueRender(handleId.current);
          handleId.current = null;
        }
      });
  }, [captionsUrl]);

  // Find current caption and highlighted word
  useEffect(() => {
    // Find active caption entry
    const activeEntry = srtData.find(
      (entry) => currentTime >= entry.start && currentTime <= entry.end
    );
    setCurrentCaption(activeEntry?.text || "");

    // Find highlighted word
    const wordIndex = words.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
    setHighlightedIndex(wordIndex);
  }, [currentTime, srtData, words]);

  // Calculate position based on style
  const getPositionStyle = () => {
    const position = style.position || "bottom";
    let x = 50; // Default center
    let y = 80; // Default bottom

    if (position === "top") {
      y = style.y || 5;
      x = style.x || 50;
    } else if (position === "bottom") {
      y = style.y || 80;
      x = style.x || 50;
    } else if (position === "center") {
      y = style.y || 50;
      x = style.x || 50;
    } else if (position === "custom") {
      x = style.x || 50;
      y = style.y || 80;
    }

    return {
      left: `${x}%`,
      top: `${y}%`,
      transform: `translate(-50%, -50%) scale(${style.scale || 1})`,
    };
  };

  // Render words with highlighting
  const renderWords = () => {
    if (!currentCaption) return <>{sceneText}</>;

    // Get words for the current active entry
    const activeEntry = srtData.find(
      (entry) => currentTime >= entry.start && currentTime <= entry.end
    );

    if (!activeEntry) return <>{currentCaption}</>;

    // Get words that belong to the active entry
    const activeWords = words.filter(
      (w) => w.entryIndex === srtData.indexOf(activeEntry)
    );

    // Split current caption into words and match with timing
    const captionWords = currentCaption.split(/(\s+)/);
    let wordIndex = 0;

    return (
      <>
        {captionWords.map((word, index) => {
          // Skip whitespace for word matching
          if (/^\s+$/.test(word)) {
            return <span key={index}>{word}</span>;
          }

          // Find matching word in active words
          const matchingWord = activeWords[wordIndex];
          const isHighlighted =
            matchingWord &&
            currentTime >= matchingWord.start &&
            currentTime <= matchingWord.end;

          wordIndex++;

          return (
            <span
              key={index}
              style={{
                color: style.textColor || "#ffffff",
                backgroundColor: isHighlighted
                  ? "rgba(255, 255, 255, 0.3)"
                  : "transparent",
                transition: "background-color 0.1s ease",
              }}
            >
              {word}
            </span>
          );
        })}
      </>
    );
  };

  if (!currentCaption && !sceneText) return null;

  const positionStyle = getPositionStyle();
  const bgColor = style.backgroundColor || "#000000";
  const bgOpacity = style.backgroundOpacity || 0.75;
  const textColor = style.textColor || "#ffffff";

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          position: "absolute",
          ...positionStyle,
          backgroundColor: `rgba(${parseInt(
            bgColor.slice(1, 3),
            16
          )}, ${parseInt(bgColor.slice(3, 5), 16)}, ${parseInt(
            bgColor.slice(5, 7),
            16
          )}, ${bgOpacity})`,
          color: textColor,
          padding: `${style.padding || 12}px`,
          borderRadius: `${style.borderRadius || 8}px`,
          fontSize: `${style.fontSize || 18}px`,
          fontWeight: style.fontWeight || "medium",
          textAlign: style.textAlign || "center",
          maxWidth: `${style.maxWidth || 800}px`,
          lineHeight: 1.4,
          borderWidth: style.borderWidth || 0,
          borderColor: style.borderColor || "#ffffff",
          borderStyle: style.borderWidth ? "solid" : "none",
          opacity: style.opacity || 1,
          boxShadow: style.shadow ? "0 2px 8px rgba(0, 0, 0, 0.5)" : "none",
          backdropFilter: style.blur ? `blur(${style.blur}px)` : "none",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {currentCaption ? renderWords() : <>{sceneText}</>}
      </div>
    </AbsoluteFill>
  );
};

// Image component with error handling and timeout
interface ImageWithErrorHandlingProps {
  src: string;
}

const ImageWithErrorHandling: React.FC<ImageWithErrorHandlingProps> = ({
  src,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const handleId = React.useRef<number | null>(null);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    // Start delay render
    handleId.current = delayRender(`Loading image: ${src}`);

    // Set timeout to clear delayRender after 30 seconds
    const timeout = setTimeout(() => {
      if (handleId.current) {
        console.warn(`⚠️ Image load timeout: ${src}`);
        continueRender(handleId.current);
        handleId.current = null;
        setIsLoading(false);
        setHasError(true);
      }
    }, 30000); // 30 seconds timeout

    // Preload image
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      clearTimeout(timeout);
      if (handleId.current) {
        continueRender(handleId.current);
        handleId.current = null;
      }
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      if (handleId.current) {
        continueRender(handleId.current);
        handleId.current = null;
      }
      setIsLoading(false);
      setHasError(true);
      console.error(`❌ Failed to load image: ${src}`);
    };

    img.src = src;

    return () => {
      clearTimeout(timeout);
      if (handleId.current) {
        continueRender(handleId.current);
        handleId.current = null;
      }
    };
  }, [src]);

  if (hasError || !src) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "24px",
        }}
      >
        {hasError ? "⚠️ Image failed to load" : "No image"}
      </AbsoluteFill>
    );
  }

  return (
    <Img
      src={src}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
      onError={() => {
        setHasError(true);
        if (handleId.current) {
          continueRender(handleId.current);
          handleId.current = null;
        }
      }}
    />
  );
};
