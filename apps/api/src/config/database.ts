import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_remotion_studio'
    
    await mongoose.connect(mongoURI)
    console.log('✅ MongoDB connected')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

