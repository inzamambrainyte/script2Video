import path from 'path'
import fs from 'fs'

/**
 * Get storage path for different asset types
 */
export function getStoragePath(type: 'audio' | 'images' | 'videos' | 'renders' | 'captions'): string {
  const basePath = process.env.STORAGE_PATH || './storage'
  const fullPath = path.join(basePath, type)
  
  // Ensure directory exists
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
  }
  
  return fullPath
}

/**
 * Get full URL for a stored file
 */
export function getFileUrl(filename: string, type: 'audio' | 'images' | 'videos' | 'renders' | 'captions'): string {
  return `/storage/${type}/${filename}`
}

