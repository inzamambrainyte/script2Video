import { processRenderJob } from '../workers/renderWorker.js'

// TODO: Implement BullMQ queue integration
export async function enqueueRenderJob(jobId: string): Promise<void> {
  // Stub implementation - replace with BullMQ
  console.log('Enqueueing render job:', jobId)

  // For MVP without queue, trigger render directly in background
  // In production, use BullMQ worker
  processRenderJob(jobId).catch((error) => {
    console.error('Error processing render job:', error)
  })

  // In real implementation with BullMQ:
  /*
  const queue = new Queue('render', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  })

  await queue.add('render-video', {
    jobId,
  })
  */
}

