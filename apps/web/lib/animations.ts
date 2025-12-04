import { SceneAsset } from "@/types";

export type AnimationType = 
  | "none" 
  | "fadeIn" 
  | "slideInLeft" 
  | "slideInRight" 
  | "slideInTop" 
  | "slideInBottom"
  | "zoomIn" 
  | "zoomOut"
  | "rotateIn"
  | "kenBurns";

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // Duration in seconds
  delay?: number; // Delay in seconds
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut";
}

export interface AnimatedTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

/**
 * Calculate animated transform based on current time and animation config
 */
export function calculateAnimationTransform(
  asset: SceneAsset,
  currentTime: number,
  sceneDuration: number
): AnimatedTransform {
  const animationType = (asset as any).animationType || "fadeIn";
  const animationDuration = (asset as any).animationDuration || 1;
  const animationDelay = (asset as any).animationDelay || 0;
  const easing = (asset as any).animationEasing || "easeOut";

  // Base transform values
  const baseX = asset.x || 0;
  const baseY = asset.y || 0;
  const baseScale = asset.scale || 1;
  const baseRotation = asset.rotation || 0;
  const baseOpacity = asset.opacity ?? 1;

  // Calculate animation progress (0 to 1)
  const animationStart = animationDelay;
  const animationEnd = animationStart + animationDuration;
  let progress = 0;

  if (currentTime < animationStart) {
    // Before animation starts
    progress = 0;
  } else if (currentTime >= animationEnd) {
    // After animation ends
    progress = 1;
  } else {
    // During animation
    progress = (currentTime - animationStart) / animationDuration;
  }

  // Apply easing
  progress = applyEasing(progress, easing);

  // Calculate animated values based on animation type
  let animatedX = baseX;
  let animatedY = baseY;
  let animatedScale = baseScale;
  let animatedRotation = baseRotation;
  let animatedOpacity = baseOpacity;

  switch (animationType) {
    case "fadeIn":
      animatedOpacity = baseOpacity * progress;
      break;

    case "slideInLeft":
      animatedX = baseX - (100 * (1 - progress));
      animatedOpacity = baseOpacity * progress;
      break;

    case "slideInRight":
      animatedX = baseX + (100 * (1 - progress));
      animatedOpacity = baseOpacity * progress;
      break;

    case "slideInTop":
      animatedY = baseY - (100 * (1 - progress));
      animatedOpacity = baseOpacity * progress;
      break;

    case "slideInBottom":
      animatedY = baseY + (100 * (1 - progress));
      animatedOpacity = baseOpacity * progress;
      break;

    case "zoomIn":
      animatedScale = baseScale * (0.5 + 0.5 * progress);
      animatedOpacity = baseOpacity * progress;
      break;

    case "zoomOut":
      animatedScale = baseScale * (1.5 - 0.5 * progress);
      animatedOpacity = baseOpacity * progress;
      break;

    case "rotateIn":
      animatedRotation = baseRotation + (360 * (1 - progress));
      animatedOpacity = baseOpacity * progress;
      break;

    case "kenBurns":
      // Ken Burns effect: slow zoom and pan
      const kenBurnsProgress = Math.min(1, currentTime / sceneDuration);
      animatedScale = baseScale * (1 + 0.2 * kenBurnsProgress);
      animatedX = baseX - (5 * kenBurnsProgress);
      animatedY = baseY - (5 * kenBurnsProgress);
      break;

    case "none":
    default:
      // No animation, use base values
      break;
  }

  return {
    x: animatedX,
    y: animatedY,
    scale: animatedScale,
    rotation: animatedRotation,
    opacity: animatedOpacity,
  };
}

/**
 * Apply easing function to progress value
 */
function applyEasing(progress: number, easing: string): number {
  switch (easing) {
    case "easeIn":
      return progress * progress;
    case "easeOut":
      return 1 - (1 - progress) * (1 - progress);
    case "easeInOut":
      return progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    case "linear":
    default:
      return progress;
  }
}

/**
 * Get default animation for asset type
 */
export function getDefaultAnimation(assetType: "image" | "video"): AnimationConfig {
  if (assetType === "video") {
    return {
      type: "fadeIn",
      duration: 0.5,
      delay: 0,
      easing: "easeOut",
    };
  }
  
  // For images, use more interesting animations
  const animations: AnimationType[] = [
    "fadeIn",
    "slideInLeft",
    "slideInRight",
    "zoomIn",
    "kenBurns",
  ];
  
  const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
  
  return {
    type: randomAnimation,
    duration: 1,
    delay: 0,
    easing: "easeOut",
  };
}

