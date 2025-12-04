const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Convert a relative storage URL to an absolute API URL
 * Example: /storage/audio/file.mp3 -> http://localhost:3001/storage/audio/file.mp3
 */
export function getStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  // If already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // If relative URL starting with /storage, prepend API URL
  if (url.startsWith('/storage/')) {
    return `${API_URL}${url}`
  }
  // Otherwise return as-is (might be a data URL or external URL)
  return url
}

export async function createProject(data: { title: string; prompt: string; userId?: string }) {
  const response = await fetch(`${API_URL}/api/v1/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create project')
  return response.json()
}

export async function getProject(id: string) {
  const response = await fetch(`${API_URL}/api/v1/projects/${id}`)
  if (!response.ok) throw new Error('Failed to fetch project')
  return response.json()
}

export async function generateScript(projectId: string, options: { tone?: string; targetLengthSeconds?: number }) {
  const response = await fetch(`${API_URL}/api/v1/projects/${projectId}/generate-script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  })
  if (!response.ok) throw new Error('Failed to generate script')
  return response.json()
}

export async function generateVoiceover(projectId: string, sceneId: string, voiceId?: string) {
  const response = await fetch(`${API_URL}/api/v1/projects/${projectId}/voiceover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sceneId, voiceId }),
  })
  if (!response.ok) throw new Error('Failed to generate voiceover')
  return response.json()
}

export async function startRender(projectId: string, options: { resolution?: string; fps?: number; format?: string }) {
  const response = await fetch(`${API_URL}/api/v1/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, ...options }),
  })
  if (!response.ok) throw new Error('Failed to start render')
  return response.json()
}

export async function getRenderStatus(jobId: string) {
  const response = await fetch(`${API_URL}/api/v1/render/${jobId}/status`)
  if (!response.ok) throw new Error('Failed to fetch render status')
  return response.json()
}

export async function searchAssets(query: string, type: 'image' | 'video' = 'image') {
  const response = await fetch(`${API_URL}/api/v1/assets/search?query=${encodeURIComponent(query)}&type=${type}`)
  if (!response.ok) throw new Error('Failed to search assets')
  return response.json()
}
