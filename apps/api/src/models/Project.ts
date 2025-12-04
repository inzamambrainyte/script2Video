import mongoose, { Schema, Document } from 'mongoose'

export interface IProject extends Document {
  title: string
  prompt: string
  userId: string
  scenes: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true },
    prompt: { type: String, default: '' },
    userId: { type: String, required: true },
    scenes: [{ type: Schema.Types.ObjectId, ref: 'Scene' }],
  },
  { timestamps: true }
)

export default mongoose.model<IProject>('Project', ProjectSchema)

