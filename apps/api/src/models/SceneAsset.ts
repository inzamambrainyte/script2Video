import mongoose, { Schema, Document } from 'mongoose'

export interface ISceneAsset extends Document {
  sceneId: mongoose.Types.ObjectId
  type: 'image' | 'video' | 'audio'
  url: string
  thumbnailUrl?: string
  name: string
  source: 'pexels' | 'unsplash' | 'freesound' | 'upload' | 'generated'
  
  // Transform properties
  x?: number
  y?: number
  width?: number
  height?: number
  scale?: number
  rotation?: number
  opacity?: number
  zIndex?: number
  
  // Audio properties
  startTime?: number
  volume?: number
  
  // Animation properties
  animationType?: string
  animationDuration?: number
  animationDelay?: number
  animationEasing?: string
  
  createdAt: Date
  updatedAt: Date
}

const SceneAssetSchema = new Schema<ISceneAsset>(
  {
    sceneId: { type: Schema.Types.ObjectId, ref: 'Scene', required: true },
    type: { type: String, enum: ['image', 'video', 'audio'], required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    name: { type: String, required: true },
    source: {
      type: String,
      enum: ['pexels', 'unsplash', 'freesound', 'upload', 'generated'],
      default: 'upload',
    },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number },
    height: { type: Number },
    scale: { type: Number, default: 1 },
    rotation: { type: Number, default: 0 },
    opacity: { type: Number, default: 1 },
    zIndex: { type: Number, default: 0 },
    startTime: { type: Number, default: 0 },
    volume: { type: Number, default: 1 },
    animationType: { type: String, default: 'fadeIn' },
    animationDuration: { type: Number, default: 1 },
    animationDelay: { type: Number, default: 0 },
    animationEasing: { type: String, default: 'easeOut' },
  },
  { timestamps: true }
)

export default mongoose.model<ISceneAsset>('SceneAsset', SceneAssetSchema)

