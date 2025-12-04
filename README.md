# AI Remotion Studio

A full-stack video generation application using Remotion for rendering. Generate videos from text prompts with AI-generated scripts, voiceovers, captions, and media assets.

## Architecture

- **Frontend**: Next.js (App Router) + TailwindCSS
- **Backend**: Express.js + MongoDB (Mongoose)
- **Renderer**: Remotion compositions with headless rendering
- **Queue**: BullMQ + Redis (optional)

## Project Structure

```
/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── renderer/         # Remotion compositions & render scripts
├── packages/
│   └── shared/       # Shared types & utilities
└── storage/          # Generated media files (local dev)
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- MongoDB (local or MongoDB Atlas)
- Redis (optional, for queue - can run without for MVP)

## Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Set up environment variables:**

   Create `apps/web/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   Create `apps/api/.env` (copy from `apps/api/.env.example`):
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/ai_remotion_studio
   PORT=3001
   NODE_ENV=development
   STORAGE_PATH=./storage
   CORS_ORIGIN=http://localhost:3000
   
   # API Keys (add your keys here)
   OPENAI_API_KEY=sk-...
   ELEVENLABS_API_KEY=...
   PEXELS_API_KEY=...
   ```

3. **Start MongoDB:**
   - **Local**: Install MongoDB Community Edition or use MongoDB Atlas (cloud)
   - Update `MONGODB_URI` in `apps/api/.env` accordingly
   - For local MongoDB on Windows, it should start as a service automatically

4. **Start Redis (optional):**
   - Only needed if using BullMQ queue (currently using simple polling)
   - Can skip for MVP - render jobs will process directly
   - For Windows: Use WSL or download Redis for Windows

## Running the Application

### Development Mode

**Option 1: Run all services in parallel**
```bash
pnpm dev
```

**Option 2: Run services individually (in separate terminals)**

Terminal 1 - Backend API:
```bash
pnpm dev:api
# API will run on http://localhost:3001
```

Terminal 2 - Frontend:
```bash
pnpm dev:web
# Frontend will run on http://localhost:3000
```

**Option 3: Run render worker (optional, for background processing)**
```bash
cd apps/api
pnpm build
node dist/workers/worker.js
```

### Production Build

```bash
# Build all apps
pnpm build

# Start production servers
cd apps/api && pnpm start
cd apps/web && pnpm start
```

### Testing the Renderer

You can test the Remotion renderer directly:
```bash
cd renderer
node render.js <projectId> <outputPath> '<scenesJson>'
```

Example:
```bash
node render.js proj_123 ./output.mp4 '[{"id":"s1","text":"Hello World","duration":5,"mediaUrl":null,"voiceUrl":null,"captionsUrl":null,"sfxUrls":[]}]'
```

## API Endpoints

### Projects
- `POST /api/v1/projects` - Create a new project
- `GET /api/v1/projects/:id` - Get project details
- `PUT /api/v1/projects/:id` - Update project

### Script Generation
- `POST /api/v1/projects/:id/generate-script` - Generate script from prompt (OpenAI)

### Voiceover
- `POST /api/v1/projects/:id/voiceover` - Generate voiceover for scenes (ElevenLabs/Google TTS)

### Captions
- `POST /api/v1/projects/:id/captions` - Generate captions from text or audio

### Rendering
- `POST /api/v1/render` - Enqueue a render job
- `GET /api/v1/render/:jobId/status` - Get render job status

### Assets
- `GET /api/v1/assets/search` - Search Pexels/Unsplash
- `POST /api/v1/assets/upload` - Upload custom assets

## Environment Variables

See `.env.example` files in each app directory for required variables.

### Required APIs
- OpenAI API Key (for script generation)
- ElevenLabs API Key OR Google Cloud TTS (for voiceover)
- Pexels API Key (for image/video search)
- Freesound API Key (optional, for SFX)

## Development Workflow

1. **Create Project**: User enters prompt → backend creates project
2. **Generate Script**: Backend calls OpenAI → returns scenes array
3. **Add Assets**: User searches/selects images/videos from Pexels
4. **Generate Voiceover**: Backend calls TTS API → saves audio files
5. **Generate Captions**: Auto-generate from text or audio transcription
6. **Render**: Enqueue render job → worker processes → Remotion renders → upload result

## TODO / Integration Points

- [ ] Replace OpenAI stubs with real API calls
- [ ] Replace ElevenLabs/Google TTS stubs with real API calls
- [ ] Implement Pexels API integration
- [ ] Implement Freesound API integration
- [ ] Add Whisper/AssemblyAI for audio transcription
- [ ] Set up S3 storage for production
- [ ] Add authentication (JWT)
- [ ] Implement BullMQ worker for render queue
- [ ] Add video preview with Remotion Player
- [ ] Add drag-and-drop scene reordering
- [ ] Add scene trimming and editing

## License

MIT
