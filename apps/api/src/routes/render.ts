import express from 'express'
import RenderJob from '../models/RenderJob.js'
import { enqueueRenderJob } from '../services/renderService.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Enqueue render job
router.post('/', async (req, res) => {
  try {
    const { projectId, resolution, fps, format, voiceId } = req.body

    const job = new RenderJob({
      projectId,
      status: 'queued',
      progress: 0,
      resolution: resolution || '1920x1080',
      fps: fps || 30,
      format: format || 'mp4',
    })

    await job.save()

    // Enqueue in worker queue (stub - will use BullMQ)
    await enqueueRenderJob(job._id.toString())

    res.json({
      jobId: job._id.toString(),
      status: job.status,
    })
  } catch (error) {
    console.error('Error enqueueing render job:', error)
    res.status(500).json({ error: 'Failed to enqueue render job' })
  }
})

// Get render job status
router.get('/:jobId/status', async (req, res) => {
  try {
    const job = await RenderJob.findById(req.params.jobId)
      .populate('projectId')

    if (!job) {
      return res.status(404).json({ error: 'Render job not found' })
    }

    res.json({
      jobId: job._id.toString(),
      status: job.status,
      progress: job.progress,
      resultUrl: job.resultUrl,
      error: job.error,
    })
  } catch (error) {
    console.error('Error fetching render job:', error)
    res.status(500).json({ error: 'Failed to fetch render job' })
  }
})

// Download render file
router.get('/download/:jobId', async (req, res) => {
  try {
    const job = await RenderJob.findById(req.params.jobId)

    if (!job) {
      return res.status(404).json({ error: 'Render job not found' })
    }

    if (job.status !== 'completed' || !job.resultUrl) {
      return res.status(400).json({ error: 'Render not completed or file not available' })
    }

    // Resolve storage path (same logic as renderWorker.ts and server.ts)
    // __dirname is apps/api/src/routes (or apps/api/dist/routes when compiled)
    // Need to find project root (where pnpm-workspace.yaml is)
    let projectRoot = __dirname
    while (
      !fs.existsSync(path.join(projectRoot, 'pnpm-workspace.yaml')) &&
      projectRoot !== path.dirname(projectRoot)
    ) {
      projectRoot = path.dirname(projectRoot)
    }

    const storagePath = process.env.STORAGE_PATH || './storage'
    const resolvedStoragePath = path.isAbsolute(storagePath)
      ? storagePath
      : path.resolve(projectRoot, storagePath)

    // Extract filename from resultUrl (e.g., /storage/renders/render_xxx.mp4 -> render_xxx.mp4)
    const filename = path.basename(job.resultUrl)
    let filePath = path.join(resolvedStoragePath, 'renders', filename)

    console.log(`📥 Download request for job ${req.params.jobId}`)
    console.log(`   Project root: ${projectRoot}`)
    console.log(`   Storage path: ${resolvedStoragePath}`)
    console.log(`   File path: ${filePath}`)
    console.log(`   File exists: ${fs.existsSync(filePath)}`)

    // Check if file exists, try alternative paths if not found
    if (!fs.existsSync(filePath)) {
      // Try alternative: direct path from resultUrl
      const alternativePath = path.join(projectRoot, job.resultUrl.replace(/^\//, ''))
      console.log(`   Trying alternative path: ${alternativePath}`)
      console.log(`   Alternative exists: ${fs.existsSync(alternativePath)}`)
      
      if (fs.existsSync(alternativePath)) {
        filePath = alternativePath
      } else {
        // List files in renders directory for debugging
        const rendersDir = path.join(resolvedStoragePath, 'renders')
        if (fs.existsSync(rendersDir)) {
          const files = fs.readdirSync(rendersDir)
          console.log(`   Files in renders directory: ${files.join(', ')}`)
        } else {
          console.log(`   Renders directory does not exist: ${rendersDir}`)
        }
        
        console.error(`❌ Render file not found: ${filePath}`)
        return res.status(404).json({ 
          error: 'Render file not found on server',
          details: {
            expectedPath: filePath,
            alternativePath: alternativePath,
            storagePath: resolvedStoragePath,
            projectRoot: projectRoot
          }
        })
      }
    }

    // Set headers for download
    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', fs.statSync(filePath).size)

    // Stream the file
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)

    fileStream.on('error', (error) => {
      console.error('Error streaming render file:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming file' })
      }
    })
  } catch (error) {
    console.error('Error downloading render file:', error)
    res.status(500).json({ error: 'Failed to download render file' })
  }
})

export default router
