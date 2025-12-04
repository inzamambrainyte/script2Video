export interface Project {
  id: string
  title: string
  prompt: string
  createdAt: string
  userId: string
}

export type { SceneAsset } from './asset'
export type { CaptionStyle } from './caption'

export interface Scene {
  id: string
  text: string
  duration: number // seconds
  keywords?: string[] // Keywords used for media search
  assets?: SceneAsset[] // Multiple assets (images, videos, audios)
  mediaUrl?: string | null // image or video URL (deprecated - use assets)
  voiceUrl: string | null // generated audio URL (deprecated - use assets)
  captionsUrl: string | null // captions/subtitles file URL
  captionStyle?: CaptionStyle // Caption styling and positioning
  sfxUrls?: string[] // sound effects URLs (deprecated - use assets)
  transition?: string
}

export interface RenderJob {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress?: number
  resultUrl?: string
  error?: string
}

export interface Asset {
  id: string
  type: 'image' | 'video' | 'audio' | 'sfx'
  url: string
  thumbnailUrl?: string
  name: string
  source: 'pexels' | 'unsplash' | 'freesound' | 'upload'
}
