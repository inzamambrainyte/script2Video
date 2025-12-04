import mongoose, { Schema, Document } from 'mongoose'

export interface IRenderJob extends Document {
  projectId: mongoose.Types.ObjectId
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number // 0-100
  resultUrl: string | null
  error: string | null
  resolution: string
  fps: number
  format: string
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

const RenderJobSchema = new Schema<IRenderJob>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    resultUrl: { type: String, default: null },
    error: { type: String, default: null },
    resolution: { type: String, default: '1920x1080' },
    fps: { type: Number, default: 30 },
    format: { type: String, default: 'mp4' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.model<IRenderJob>('RenderJob', RenderJobSchema)

