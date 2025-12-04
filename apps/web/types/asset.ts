export interface SceneAsset {
  id: string
  type: 'image' | 'video' | 'audio'
  url: string
  thumbnailUrl?: string
  name: string
  source: 'pexels' | 'unsplash' | 'freesound' | 'upload' | 'generated'
  
  // Transform properties (for images/videos)
  x?: number // Position X (percentage or pixels)
  y?: number // Position Y (percentage or pixels)
  width?: number // Width (percentage or pixels)
  height?: number // Height (percentage or pixels)
  scale?: number // Scale factor (1.0 = 100%)
  rotation?: number // Rotation in degrees
  opacity?: number // Opacity (0-1)
  zIndex?: number // Layer order
  
  // Audio properties
  startTime?: number // Start time in seconds (for audio)
  volume?: number // Volume (0-1)
  
  // Animation properties
  animationType?: 'none' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'slideInTop' | 'slideInBottom' | 'zoomIn' | 'zoomOut' | 'rotateIn' | 'kenBurns'
  animationDuration?: number // Animation duration in seconds
  animationDelay?: number // Animation delay in seconds
  animationEasing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

