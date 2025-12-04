import express from 'express'
import multer from 'multer'
import path from 'path'
import { searchPexels } from '../services/assetService.js'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const storagePath = process.env.STORAGE_PATH || './storage'
    cb(null, storagePath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({ storage })

// Search Pexels (supports both GET and POST)
router.get('/search', async (req, res) => {
  try {
    const { query, type, perPage, page } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' })
    }

    const result = await searchPexels(query as string, {
      type: (type as 'image' | 'video') || 'image',
      perPage: parseInt(perPage as string) || 10,
      page: parseInt(page as string) || 1,
    })

    res.json(result)
  } catch (error) {
    console.error('Error searching assets:', error)
    res.status(500).json({ error: 'Failed to search assets' })
  }
})

router.post('/search', async (req, res) => {
  try {
    const { query, type, perPage, page } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' })
    }

    const result = await searchPexels(query as string, {
      type: (type as 'image' | 'video') || 'image',
      perPage: perPage || 10,
      page: page || 1,
    })

    res.json(result)
  } catch (error) {
    console.error('Error searching assets:', error)
    res.status(500).json({ error: 'Failed to search assets' })
  }
})

// Upload asset
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const fileUrl = `/storage/${req.file.filename}`

    res.json({
      id: req.file.filename,
      url: fileUrl,
      name: req.file.originalname,
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
    })
  } catch (error) {
    console.error('Error uploading asset:', error)
    res.status(500).json({ error: 'Failed to upload asset' })
  }
})

export default router
