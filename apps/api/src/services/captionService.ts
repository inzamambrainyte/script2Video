import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables if not already loaded
const apiServicesDir = path.resolve(__dirname, '..')
const apiDir = path.resolve(apiServicesDir, '..')
const envPath = path.resolve(apiDir, '.env')

if (fs.existsSync(envPath) && !process.env.OPENAI_API_KEY) {
  dotenv.config({ path: envPath })
}

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY
const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null

// Helper to format SRT time
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.floor((seconds % 1) * 1000)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis.toString().padStart(3, '0')}`
}

// Generate SRT content from text with word-level timings
function generateSRTFromText(text: string, duration: number, startTime: number = 0): string {
  const words = text.trim().split(/\s+/)
  if (words.length === 0) {
    return ''
  }

  // Calculate time per word (distribute duration evenly across words)
  const timePerWord = duration / words.length
  const srtEntries: string[] = []
  
  // Create multiple caption entries if text is long (for better readability)
  const maxWordsPerCaption = 8 // Show ~8 words per caption block
  const numCaptions = Math.ceil(words.length / maxWordsPerCaption)
  
  for (let i = 0; i < numCaptions; i++) {
    const startIdx = i * maxWordsPerCaption
    const endIdx = Math.min(startIdx + maxWordsPerCaption, words.length)
    const captionWords = words.slice(startIdx, endIdx)
    
    const captionStartTime = startTime + (startIdx * timePerWord)
    const captionEndTime = startTime + (endIdx * timePerWord)
    
    // Format caption text (split into max 2 lines if needed)
    const captionText = formatCaptionLines(captionWords.join(' '))
    
    srtEntries.push(
      `${i + 1}\n${formatSRTTime(captionStartTime)} --> ${formatSRTTime(captionEndTime)}\n${captionText}\n\n`
    )
  }
  
  return srtEntries.join('')
}

// Helper to format caption text into readable lines
function formatCaptionLines(text: string, maxCharsPerLine: number = 42, maxLines: number = 2): string {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length <= maxCharsPerLine && lines.length < maxLines) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        // Word is too long, add it anyway
        lines.push(word)
        currentLine = ''
      }
      if (lines.length >= maxLines) {
        // Add remaining words to last line if there's space
        if (currentLine && lines.length > 0) {
          const lastLine = lines[lines.length - 1]
          if ((lastLine + ' ' + currentLine).length <= maxCharsPerLine * 1.5) {
            lines[lines.length - 1] = lastLine + ' ' + currentLine
            currentLine = ''
          }
        }
        break
      }
    }
  }
  
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }
  
  return lines.join('\n')
}

// Get storage path for captions
function getCaptionsStoragePath() {
  const storagePath = process.env.STORAGE_PATH || './storage'
  const apiSrcDir = path.resolve(__dirname, '..') // services -> src
  const apiDir = path.resolve(apiSrcDir, '..') // src -> api
  const projectRoot = path.resolve(apiDir, '..') // api -> remotion
  
  const resolved = path.isAbsolute(storagePath)
    ? storagePath
    : path.resolve(projectRoot, storagePath)
  
  return path.join(resolved, 'captions')
}

// Transcribe audio using OpenAI Whisper
async function transcribeAudioWithWhisper(
  audioFilePath: string
): Promise<{ text: string; segments: Array<{ start: number; end: number; text: string }> }> {
  if (!openai) {
    throw new Error('OpenAI API key not configured')
  }

  console.log(`🎤 Transcribing audio with Whisper: ${audioFilePath}`)

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFilePath),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    const segments = (transcription as any).segments || []
    const text = transcription.text || ''

    return {
      text,
      segments: segments.map((seg: any) => ({
        start: seg.start || 0,
        end: seg.end || 0,
        text: seg.text || '',
      })),
    }
  } catch (error) {
    console.error('❌ Whisper transcription failed:', error)
    throw error
  }
}

// Get audio file path from URL
function getAudioFilePath(voiceUrl: string): string | null {
  if (!voiceUrl) return null

  // If it's a storage URL, convert to file path
  if (voiceUrl.startsWith('/storage/')) {
    const storagePath = process.env.STORAGE_PATH || './storage'
    const apiSrcDir = path.resolve(__dirname, '..')
    const apiDir = path.resolve(apiSrcDir, '..')
    const projectRoot = path.resolve(apiDir, '..')
    const resolved = path.isAbsolute(storagePath)
      ? storagePath
      : path.resolve(projectRoot, storagePath)
    
    const relativePath = voiceUrl.replace('/storage/', '')
    const filePath = path.join(resolved, relativePath)
    
    if (fs.existsSync(filePath)) {
      return filePath
    }
  }

  // If it's a full URL, we'd need to download it first (not implemented)
  // For now, return null if it's not a local file
  return null
}

// Generate SRT from Whisper segments
function generateSRTFromSegments(
  segments: Array<{ start: number; end: number; text: string }>,
  startTime: number = 0
): string {
  const srtEntries: string[] = []

  segments.forEach((segment, index) => {
    const segmentStart = startTime + segment.start
    const segmentEnd = startTime + segment.end
    const text = segment.text.trim()

    if (text) {
      srtEntries.push(
        `${index + 1}\n${formatSRTTime(segmentStart)} --> ${formatSRTTime(segmentEnd)}\n${text}\n\n`
      )
    }
  })

  return srtEntries.join('')
}

export async function generateCaptions(
  scenes: Array<{ _id: any; text: string; voiceUrl?: string | null; duration?: number }>
): Promise<Record<string, string>> {
  console.log('Generating captions for', scenes.length, 'scenes')

  const captionsDir = getCaptionsStoragePath()
  if (!fs.existsSync(captionsDir)) {
    fs.mkdirSync(captionsDir, { recursive: true })
  }

  const captions: Record<string, string> = {}
  let currentTime = 0

  for (const scene of scenes) {
    const sceneId = scene._id.toString()
    const duration = scene.duration || 5
    let srtContent: string

    // Try to use Whisper transcription if audio is available
    if (scene.voiceUrl && openai) {
      const audioFilePath = getAudioFilePath(scene.voiceUrl)
      
      if (audioFilePath) {
        try {
          console.log(`🎤 Attempting Whisper transcription for scene ${sceneId}...`)
          const transcription = await transcribeAudioWithWhisper(audioFilePath)
          
          if (transcription.segments && transcription.segments.length > 0) {
            // Use Whisper segments for accurate timing
            srtContent = generateSRTFromSegments(transcription.segments, currentTime)
            console.log(`✅ Generated captions from Whisper transcription for scene ${sceneId}`)
          } else {
            // Fallback to text-based if no segments
            console.log(`⚠️ No segments from Whisper, using text-based captions for scene ${sceneId}`)
            srtContent = generateSRTFromText(scene.text, duration, currentTime)
          }
        } catch (error) {
          console.warn(`⚠️ Whisper transcription failed for scene ${sceneId}, using text-based captions:`, error)
          // Fallback to text-based generation
          srtContent = generateSRTFromText(scene.text, duration, currentTime)
        }
      } else {
        // No audio file available, use text-based
        console.log(`ℹ️ No audio file found for scene ${sceneId}, using text-based captions`)
        srtContent = generateSRTFromText(scene.text, duration, currentTime)
      }
    } else {
      // No audio URL or OpenAI not configured, use text-based generation
      srtContent = generateSRTFromText(scene.text, duration, currentTime)
    }

    const filename = `caption_${sceneId}.srt`
    const filePath = path.join(captionsDir, filename)
    
    fs.writeFileSync(filePath, srtContent, 'utf-8')
    
    const captionUrl = `/storage/captions/${filename}`
    captions[sceneId] = captionUrl
    
    console.log(`✅ Generated caption for scene ${sceneId}: ${captionUrl}`)
    
    currentTime += duration
  }

  return captions
}

