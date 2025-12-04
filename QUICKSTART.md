# Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`) - install with `npm install -g pnpm`
- [ ] MongoDB running locally OR MongoDB Atlas account

## Step-by-Step Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment

**Backend:**
```bash
cd apps/api
cp .env.example .env
# Edit .env and add your MongoDB URI (and API keys if you have them)
```

**Frontend:**
```bash
cd apps/web
# Create .env.local (or it will use defaults)
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
```

### 3. Start MongoDB

**Option A: Local MongoDB**
- Windows: Should start automatically as a service
- Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

**Option B: MongoDB Atlas (Cloud)**
- Create free account at https://www.mongodb.com/cloud/atlas
- Get connection string and update `MONGODB_URI` in `apps/api/.env`

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
pnpm dev:api
```
Wait for: `🚀 API server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
pnpm dev:web
```
Wait for: `Ready on http://localhost:3000`

### 5. Open Browser

Navigate to: **http://localhost:3000**

## First Steps in the App

1. Click **"Create Video"** button
2. Click **"Generate Script"** (uses stub - will create sample scenes)
3. Edit scene text by clicking on scenes
4. Click **"Generate Voiceover"** for a scene (stub - creates placeholder)
5. Search for assets or upload images
6. Click **"Render Video"** to start render job

## Testing the Renderer Directly

```bash
cd renderer
node render.js test_proj ./test-output.mp4 '[{"id":"s1","text":"Hello World","duration":5,"mediaUrl":null,"voiceUrl":null,"captionsUrl":null,"sfxUrls":[]}]'
```

## Troubleshooting

**"Cannot connect to MongoDB"**
- Check MongoDB is running: `mongosh` or check service status
- Verify `MONGODB_URI` in `apps/api/.env`

**"Port 3000/3001 already in use"**
- Kill existing process or change ports in config

**"Module not found" errors**
- Run `pnpm install` again
- Make sure you're in the project root

**Render errors**
- Ensure all dependencies installed: `cd renderer && pnpm install`
- Check that storage directory is writable

## Next Steps

- [ ] Add real OpenAI API key for script generation
- [ ] Add ElevenLabs API key for voiceover
- [ ] Add Pexels API key for asset search
- [ ] Set up Redis for proper queue (optional)
- [ ] Customize video composition styles

## Need Help?

- Check `README.md` for detailed documentation
- Check `SETUP.md` for detailed setup instructions
- Check `PROJECT_STRUCTURE.md` for code organization

