// Shared types across frontend, backend, and renderer

export interface Project {
  id: string
  title: string
  prompt: string
  userId: string
  createdAt: string
  updatedAt?: string
}

export interface Scene {
  id: string
  text: string
  duration: number // seconds
  mediaUrl: string | null
  voiceUrl: string | null
  captionsUrl: string | null
  sfxUrls: string[]
  transition?: string
  order?: number
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

