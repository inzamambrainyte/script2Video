import mongoose, { Schema, Document } from 'mongoose'

export interface IScene extends Document {
  projectId: mongoose.Types.ObjectId
  text: string
  duration: number // seconds
  keywords: string[] // Keywords for searching media
  mediaUrl: string | null // Deprecated - use assets array
  voiceUrl: string | null // Deprecated - use assets array
  captionsUrl: string | null
  captionStyle: {
    position?: string
    x?: number
    y?: number
    fontSize?: number
    maxWidth?: number
    padding?: number
    backgroundColor?: string
    backgroundOpacity?: number
    textColor?: string
    fontFamily?: string
    fontWeight?: string | number
    textAlign?: string
    borderWidth?: number
    borderColor?: string
    borderRadius?: number
    shadow?: boolean
    blur?: number
    scale?: number
    rotation?: number
    opacity?: number
  }
  assets: mongoose.Types.ObjectId[] // References to SceneAsset documents
  transition: string
  order: number
  createdAt: Date
  updatedAt: Date
}

const SceneSchema = new Schema<IScene>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    text: { type: String, required: true },
    duration: { type: Number, default: 5 },
    keywords: [{ type: String }], // Keywords for media search
    mediaUrl: { type: String, default: null }, // Deprecated - kept for backward compatibility
    voiceUrl: { type: String, default: null }, // Deprecated - kept for backward compatibility
    captionsUrl: { type: String, default: null },
    captionStyle: {
      type: {
        position: { type: String, default: 'bottom' },
        x: { type: Number },
        y: { type: Number },
        fontSize: { type: Number, default: 18 },
        maxWidth: { type: Number, default: 800 },
        padding: { type: Number, default: 12 },
        backgroundColor: { type: String, default: '#000000' },
        backgroundOpacity: { type: Number, default: 0.75 },
        textColor: { type: String, default: '#ffffff' },
        fontFamily: { type: String, default: 'Arial' },
        fontWeight: { type: Schema.Types.Mixed, default: 'medium' },
        textAlign: { type: String, default: 'center' },
        borderWidth: { type: Number, default: 0 },
        borderColor: { type: String, default: '#ffffff' },
        borderRadius: { type: Number, default: 8 },
        shadow: { type: Boolean, default: false },
        blur: { type: Number, default: 0 },
        scale: { type: Number, default: 1 },
        rotation: { type: Number, default: 0 },
        opacity: { type: Number, default: 1 },
      },
      default: {},
    },
    assets: [{ type: Schema.Types.ObjectId, ref: 'SceneAsset' }], // Multiple assets per scene
    transition: { type: String, default: 'fade' },
    order: { type: Number, required: true },
  },
  { timestamps: true }
)

export default mongoose.model<IScene>('Scene', SceneSchema)

