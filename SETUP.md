# Setup Guide

## Quick Start

1. **Clone and install:**
   ```bash
   pnpm install
   ```

2. **Set up environment:**
   - Copy `apps/api/.env.example` to `apps/api/.env`
   - Create `apps/web/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3001`

3. **Start MongoDB:**
   - Local: Ensure MongoDB is running on `mongodb://127.0.0.1:27017`
   - Or use MongoDB Atlas and update `MONGODB_URI` in `.env`

4. **Run the app:**
   ```bash
   pnpm dev
   ```

5. **Open browser:**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

## Project Structure

```
ai-remotion-studio/
├── apps/
│   ├── web/              # Next.js frontend
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   └── lib/          # API client utilities
│   └── api/              # Express backend
│       ├── src/
│       │   ├── models/   # Mongoose models
│       │   ├── routes/   # API routes
│       │   ├── services/ # Business logic
│       │   └── workers/  # Background workers
├── renderer/             # Remotion renderer
│   ├── src/             # Remotion compositions
│   └── render.js        # Render script
├── packages/
│   └── shared/          # Shared types
└── storage/             # Generated files (created automatically)
```

## API Integration Checklist

### Current Status (Stubs)
- ✅ Project creation and management
- ✅ Scene management
- ✅ Render job queueing
- ⚠️ Script generation (OpenAI stub)
- ⚠️ Voiceover generation (ElevenLabs stub)
- ⚠️ Caption generation (Whisper stub)
- ⚠️ Asset search (Pexels stub)

### To Integrate Real APIs

1. **OpenAI (Script Generation)**
   - Install: `pnpm add openai`
   - Update: `apps/api/src/services/scriptService.ts`
   - Add API key to `.env`

2. **ElevenLabs (Voiceover)**
   - Install: `pnpm add axios` (already installed)
   - Update: `apps/api/src/services/voiceoverService.ts`
   - Add API key to `.env`

3. **Pexels (Assets)**
   - Update: `apps/api/src/services/assetService.ts`
   - Add API key to `.env`

4. **Whisper/AssemblyAI (Captions)**
   - Choose provider and install SDK
   - Update: `apps/api/src/services/captionService.ts`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongosh` or check service status
- Verify `MONGODB_URI` in `.env` is correct
- For Atlas, check network access and connection string

### Remotion Render Errors
- Ensure all dependencies are installed: `cd renderer && pnpm install`
- Check that scene data is valid JSON
- Verify media URLs are accessible

### Port Already in Use
- Change `PORT` in `apps/api/.env`
- Change port in `apps/web/package.json` scripts or Next.js config

### Storage Directory Issues
- Ensure `STORAGE_PATH` directory exists or is writable
- Check file permissions on Windows/Linux

## Next Steps

1. Replace API stubs with real implementations
2. Add authentication (JWT)
3. Set up BullMQ with Redis for proper queue
4. Add S3 storage for production
5. Implement drag-and-drop scene reordering
6. Add video preview with Remotion Player
7. Add scene trimming and editing features

