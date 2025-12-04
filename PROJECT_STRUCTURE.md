# Project Structure

## Monorepo Overview

This is a pnpm workspace monorepo with the following structure:

```
ai-remotion-studio/
├── apps/
│   ├── web/                    # Next.js frontend (App Router)
│   │   ├── app/               # Next.js pages
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── create/        # Video creation page
│   │   │   └── layout.tsx     # Root layout
│   │   ├── components/        # React components
│   │   │   ├── Topbar.tsx     # Top navigation bar
│   │   │   ├── ScenesPanel.tsx # Left panel - scenes list
│   │   │   ├── CanvasPreview.tsx # Center - video preview
│   │   │   └── AssetsPanel.tsx  # Right panel - assets
│   │   ├── lib/               # Utilities
│   │   │   └── api.ts         # API client functions
│   │   └── types/             # TypeScript types
│   │       └── index.ts       # Shared types
│   │
│   └── api/                    # Express.js backend
│       ├── src/
│       │   ├── server.ts       # Express app entry point
│       │   ├── config/         # Configuration
│       │   │   └── database.ts # MongoDB connection
│       │   ├── models/         # Mongoose models
│       │   │   ├── Project.ts  # Project model
│       │   │   ├── Scene.ts   # Scene model
│       │   │   └── RenderJob.ts # Render job model
│       │   ├── routes/         # API routes
│       │   │   ├── projects.ts # Project endpoints
│       │   │   ├── render.ts   # Render endpoints
│       │   │   └── assets.ts   # Asset endpoints
│       │   ├── services/       # Business logic
│       │   │   ├── scriptService.ts      # OpenAI script generation
│       │   │   ├── voiceoverService.ts   # TTS generation
│       │   │   ├── captionService.ts     # Caption generation
│       │   │   ├── renderService.ts      # Render job queueing
│       │   │   └── assetService.ts       # Asset search (Pexels)
│       │   ├── workers/        # Background workers
│       │   │   ├── renderWorker.ts # Render job processor
│       │   │   └── worker.ts      # Standalone worker script
│       │   └── utils/          # Utilities
│       │       └── storage.ts  # Storage path helpers
│       └── .env.example        # Environment variables template
│
├── renderer/                   # Remotion renderer
│   ├── src/
│   │   ├── index.tsx          # Remotion root (compositions)
│   │   └── VideoComposition.tsx # Main video composition
│   ├── render.js               # Render script (CLI)
│   └── remotion.config.ts      # Remotion configuration
│
├── packages/
│   └── shared/                 # Shared code
│       └── src/
│           └── index.ts        # Shared TypeScript types
│
├── storage/                     # Generated files (gitignored)
│   ├── audio/                  # Generated voiceovers
│   ├── images/                 # Uploaded images
│   ├── videos/                 # Uploaded videos
│   ├── renders/                # Final rendered videos
│   └── captions/               # Caption files
│
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # pnpm workspace definition
├── README.md                   # Main documentation
├── SETUP.md                    # Setup guide
└── .gitignore                  # Git ignore rules
```

## Key Files

### Frontend (`apps/web`)
- **`app/create/page.tsx`**: Main video creation interface
- **`components/ScenesPanel.tsx`**: Left sidebar with scenes list
- **`components/CanvasPreview.tsx`**: Center preview area
- **`components/AssetsPanel.tsx`**: Right sidebar for assets
- **`lib/api.ts`**: API client functions

### Backend (`apps/api`)
- **`src/server.ts`**: Express server setup
- **`src/routes/projects.ts`**: Project CRUD and script generation
- **`src/routes/render.ts`**: Render job management
- **`src/services/*.ts`**: Service layer (API integrations)
- **`src/workers/renderWorker.ts`**: Remotion render processor

### Renderer (`renderer`)
- **`src/VideoComposition.tsx`**: Remotion composition component
- **`render.js`**: CLI script to render videos

## Data Flow

1. **User creates project** → `POST /api/v1/projects`
2. **User generates script** → `POST /api/v1/projects/:id/generate-script`
   - Calls OpenAI (stub) → Returns scenes array
3. **User adds assets** → Search Pexels or upload → `POST /api/v1/assets/upload`
4. **User generates voiceover** → `POST /api/v1/projects/:id/voiceover`
   - Calls ElevenLabs (stub) → Saves audio file
5. **User triggers render** → `POST /api/v1/render`
   - Creates render job → Worker processes → Remotion renders → Returns video URL

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Express.js, MongoDB (Mongoose), TypeScript
- **Renderer**: Remotion 4.0
- **Package Manager**: pnpm (workspaces)
- **Queue**: Simple polling (can upgrade to BullMQ + Redis)

## API Contracts

See `README.md` for detailed API endpoint documentation.

## Environment Variables

- **Frontend**: `NEXT_PUBLIC_API_URL`
- **Backend**: See `apps/api/.env.example`
  - MongoDB, Redis, API keys (OpenAI, ElevenLabs, Pexels)
  - Storage paths, CORS settings

