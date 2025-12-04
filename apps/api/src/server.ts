import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { connectDB } from './config/database.js'
import projectRoutes from './routes/projects.js'
import renderRoutes from './routes/render.js'
import assetRoutes from './routes/assets.js'

// Load environment variables from .env file
// __dirname is apps/api/src, so .env should be in apps/api/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const apiDir = path.resolve(__dirname, '..') // apps/api/src -> apps/api
const envPath = path.resolve(apiDir, '.env')

// Load .env file with explicit path
dotenv.config({ path: envPath })

console.log(`📄 Loading .env from: ${envPath}`)
console.log(`📄 .env file exists: ${fs.existsSync(envPath)}`)
console.log(`🔑 OPENAI_API_KEY is set: ${!!process.env.OPENAI_API_KEY}`)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware - CORS configuration
// Allow multiple origins for development (web app and Remotion renderer)
const allowedOrigins = [
  'http://localhost:3000', // Next.js web app
  'http://localhost:3002', // Remotion renderer
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : [])
]

console.log(`🌐 CORS origins configured: ${allowedOrigins.join(', ')}`)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files from storage
// Resolve relative to project root (not current working directory)
// __dirname is apps/api/src, so we need to go up 3 levels to project root
// apps/api/src -> .. -> apps/api -> .. -> remotion (project root)
// Note: apiDir is already declared above for .env loading
const storagePath = process.env.STORAGE_PATH || './storage'
const projectRoot = path.resolve(apiDir, '..') // apps/api -> remotion (project root)
const resolvedStoragePath = path.isAbsolute(storagePath)
  ? storagePath
  : path.resolve(projectRoot, storagePath)

console.log(`📁 Storage configuration:`)
console.log(`   __dirname: ${__dirname}`)
console.log(`   apiDir: ${apiDir}`)
console.log(`   projectRoot: ${projectRoot}`)
console.log(`   resolvedStoragePath: ${resolvedStoragePath}`)

// Ensure storage directory exists
if (!fs.existsSync(resolvedStoragePath)) {
  fs.mkdirSync(resolvedStoragePath, { recursive: true })
}

console.log(`📁 Serving static files from: ${resolvedStoragePath}`)
console.log(`📁 Current working directory: ${process.cwd()}`)

// Serve static files from storage
app.use('/storage', express.static(resolvedStoragePath, {
  dotfiles: 'allow',
  etag: true,
  lastModified: true,
}))

// Debug endpoint to check storage path
app.get('/debug/storage', (req, res) => {
  const audioDir = path.join(resolvedStoragePath, 'audio')
  const files = fs.existsSync(audioDir) 
    ? fs.readdirSync(audioDir).map(f => ({
        name: f,
        path: path.join(audioDir, f),
        exists: fs.existsSync(path.join(audioDir, f)),
        size: fs.existsSync(path.join(audioDir, f)) ? fs.statSync(path.join(audioDir, f)).size : 0,
      }))
    : []
  
  res.json({
    storagePath: resolvedStoragePath,
    audioDir,
    audioDirExists: fs.existsSync(audioDir),
    files,
    cwd: process.cwd(),
  })
})

// Connect to MongoDB
connectDB()

// Routes
app.use('/api/v1/projects', projectRoutes)
app.use('/api/v1/render', renderRoutes)
app.use('/api/v1/assets', assetRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`)
})

