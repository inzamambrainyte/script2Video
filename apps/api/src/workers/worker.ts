/**
 * Standalone worker script to process render jobs
 * Run with: node dist/workers/worker.js
 * 
 * TODO: Replace with BullMQ worker when Redis is set up
 */

import { connectDB } from '../config/database.js'
import RenderJob from '../models/RenderJob.js'
import { processRenderJob } from './renderWorker.js'

async function worker() {
  console.log('🚀 Starting render worker...')
  
  // Connect to database
  await connectDB()

  // Poll for queued jobs
  setInterval(async () => {
    try {
      const job = await RenderJob.findOne({ status: 'queued' })
      
      if (job) {
        console.log(`📦 Found queued job: ${job._id}`)
        await processRenderJob(job._id.toString())
      }
    } catch (error) {
      console.error('❌ Worker error:', error)
    }
  }, 5000) // Poll every 5 seconds

  console.log('✅ Worker running. Polling for jobs...')
}

worker().catch(console.error)

