"use client";

import { useState, useEffect, useRef } from "react";
import { CaptionStyle } from "@/types";

interface Word {
  text: string;
  startTime: number;
  endTime: number;
}

interface WordHighlightedCaptionsProps {
  captionText: string;
  audioUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration?: number; // Scene/audio duration for better timing calculation
  style?: CaptionStyle;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function WordHighlightedCaptions({
  captionText,
  audioUrl,
  isPlaying,
  currentTime,
  duration,
  style,
  onClick,
  isSelected,
}: WordHighlightedCaptionsProps) {
  const [words, setWords] = useState<Word[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse caption text into words with estimated timing
  useEffect(() => {
    if (!captionText) {
      setWords([]);
      return;
    }

    // Split text into words and spaces, preserving all whitespace
    const wordArray = captionText.split(/(\s+)/);

    // Filter out empty strings from split
    const filteredArray = wordArray.filter((w) => w.length > 0);

    // Calculate timing based on actual duration if available
    // Otherwise use estimated speaking rate
    let totalDuration: number;
    if (duration && duration > 0) {
      // Use actual duration - distribute time across all words
      totalDuration = duration;
    } else {
      // Estimate: ~3 words per second for normal speech
      const wordsPerSecond = 3.0;
      const wordCount = filteredArray.filter((w) => !/^\s+$/.test(w)).length;
      totalDuration = wordCount / wordsPerSecond;
    }

    const wordCount = filteredArray.filter((w) => !/^\s+$/.test(w)).length;
    const baseTimePerWord = wordCount > 0 ? totalDuration / wordCount : 0.3;

    let currentTime = 0;
    const wordTimings: Word[] = filteredArray.map((text) => {
      const isWhitespace = /^\s+$/.test(text);

      if (isWhitespace) {
        // Whitespace - minimal time, but preserve it
        const startTime = currentTime;
        currentTime += 0.05; // Slightly longer for natural pauses
        return {
          text: text, // Preserve original spacing
          startTime,
          endTime: currentTime,
        };
      }

      // Actual word - calculate timing based on length and punctuation
      const cleanText = text.replace(/[^\w]/g, ""); // Remove punctuation for length calculation
      const wordLength = cleanText.length;

      // Base duration with adjustments:
      // - Longer words take more time
      // - Punctuation adds slight pause
      // - Minimum duration to prevent too-fast highlighting
      const hasPunctuation = /[.,!?;:]/.test(text);
      const baseDuration = Math.max(
        0.2,
        baseTimePerWord * (1 + wordLength * 0.08)
      );
      const duration = hasPunctuation ? baseDuration * 1.3 : baseDuration; // Punctuation adds pause

      const startTime = currentTime;
      currentTime += duration;

      return {
        text: text, // Preserve original with punctuation
        startTime,
        endTime: currentTime,
      };
    });

    setWords(wordTimings);
  }, [captionText, duration]);

  // Sync highlighting with audio playback
  useEffect(() => {
    if (words.length === 0) {
      setHighlightedIndex(-1);
      return;
    }

    // Find the current word based on playback time
    // Use a more lenient matching to handle timing variations
    const currentWordIndex = words.findIndex((word, index) => {
      // Check if current time is within word's time range
      // Add small buffer for better sync
      const buffer = 0.1; // 100ms buffer
      return (
        currentTime >= word.startTime - buffer &&
        currentTime < word.endTime + buffer
      );
    });

    // Also check if we're between words (use previous word if close)
    if (currentWordIndex === -1 && words.length > 0) {
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      // If we're past the last word but within 0.5s, keep highlighting it
      if (
        currentTime >= lastWord.endTime &&
        currentTime < lastWord.endTime + 0.5
      ) {
        setHighlightedIndex(lastWordIndex);
        return;
      }

      // If we're before the first word, don't highlight
      if (currentTime < words[0].startTime) {
        setHighlightedIndex(-1);
        return;
      }
    }

    if (currentWordIndex !== -1 && currentWordIndex !== highlightedIndex) {
      setHighlightedIndex(currentWordIndex);
    } else if (currentWordIndex === -1 && highlightedIndex !== -1) {
      // Clear highlight if we're not in any word's range
      setHighlightedIndex(-1);
    }
  }, [currentTime, isPlaying, words, highlightedIndex]);

  // Auto-scroll to keep highlighted word visible
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (
      highlightedIndex >= 0 &&
      containerRef.current &&
      wordRefs.current[highlightedIndex]
    ) {
      const wordElement = wordRefs.current[highlightedIndex];
      if (wordElement) {
        wordElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }
  }, [highlightedIndex]);

  if (!captionText || words.length === 0) {
    return null;
  }

  // Calculate position based on style
  const getPositionStyle = (): React.CSSProperties => {
    const s = (style || {}) as CaptionStyle;
    let positionStyle: React.CSSProperties = {
      position: "absolute",
      zIndex: 50,
    };

    if (s.position === "top") {
      positionStyle.top = "5%";
      positionStyle.left = "50%";
      positionStyle.transform = "translateX(-50%)";
    } else if (s.position === "center") {
      positionStyle.top = "50%";
      positionStyle.left = "50%";
      positionStyle.transform = "translate(-50%, -50%)";
    } else if (
      s.position === "custom" &&
      s.x !== undefined &&
      s.y !== undefined
    ) {
      positionStyle.left = `${s.x}%`;
      positionStyle.top = `${s.y}%`;
      positionStyle.transform = "translate(-50%, -50%)";
    } else {
      // Default: bottom
      positionStyle.bottom = "80px";
      positionStyle.left = "50%";
      positionStyle.transform = "translateX(-50%)";
    }

    return positionStyle;
  };

  const containerStyle: React.CSSProperties = {
    ...getPositionStyle(),
    maxWidth: `${style?.maxWidth || 800}px`,
    padding: `0 ${style?.padding || 16}px`,
    cursor: onClick ? "pointer" : "default",
  };

  const captionBoxStyle: React.CSSProperties = {
    backgroundColor: style?.backgroundColor || "rgba(0, 0, 0, 0.75)",
    padding: `${style?.padding || 12}px ${(style?.padding || 12) * 1.5}px`,
    borderRadius: `${style?.borderRadius || 8}px`,
    borderWidth: isSelected ? 2 : style?.borderWidth || 0,
    borderColor: isSelected ? "#0ea5e9" : style?.borderColor || "#ffffff",
    borderStyle:
      isSelected || (style?.borderWidth && style.borderWidth > 0)
        ? "solid"
        : "none",
    backdropFilter: style?.blur ? `blur(${style.blur}px)` : "blur(4px)",
    transform: `scale(${style?.scale || 1}) rotate(${style?.rotation || 0}deg)`,
    opacity: (style?.opacity ?? 1) * (style?.backgroundOpacity ?? 0.75),
    transition: "border-color 0.2s ease",
  };

  const textStyle: React.CSSProperties = {
    color: style?.textColor || "#ffffff",
    fontSize: `${style?.fontSize || 18}px`,
    fontFamily: style?.fontFamily || "Arial, sans-serif",
    fontWeight: style?.fontWeight || "medium",
    textAlign: (style?.textAlign || "center") as
      | "left"
      | "center"
      | "right"
      | "justify",
    lineHeight: 1.5,
    textShadow: style?.shadow ? "2px 2px 4px rgba(0,0,0,0.8)" : "none",
  };

  return (
    <div ref={containerRef} style={containerStyle} onClick={onClick}>
      <div style={captionBoxStyle}>
        <p style={textStyle} className="whitespace-pre-wrap">
          {words.map((word, index) => {
            const isHighlighted = index === highlightedIndex;
            const isWhitespace = /^\s+$/.test(word.text);

            // For whitespace, render as-is without styling
            if (isWhitespace) {
              return <span key={index}>{word.text}</span>;
            }

            return (
              <span
                key={index}
                ref={(el) => {
                  wordRefs.current[index] = el;
                }}
                className={`transition-all duration-200 ${
                  isHighlighted
                    ? "bg-primary-500/70 font-bold px-1.5 py-0.5 rounded scale-105 inline-block"
                    : "inline"
                }`}
                style={{
                  color: isHighlighted
                    ? "#ffffff"
                    : textStyle.color || "#ffffff",
                }}
              >
                {word.text}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
