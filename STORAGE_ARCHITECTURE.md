# Storage Architecture

## Current Approach: File System + Database URLs

### How It Works

1. **Files are stored on disk** in the `storage/` directory:
   - `storage/audio/` - Generated voiceover files
   - `storage/images/` - Uploaded images
   - `storage/videos/` - Uploaded videos
   - `storage/renders/` - Final rendered videos
   - `storage/captions/` - Caption/subtitle files

2. **URLs are stored in the database** (MongoDB):
   - Scene model stores `mediaUrl`, `voiceUrl`, `captionsUrl` as strings
   - These are HTTP URLs like `/storage/audio/filename.mp3`
   - Frontend accesses files via these URLs

3. **Express serves static files**:
   - API server serves files from `storage/` via `/storage` route
   - Frontend requests: `http://localhost:3001/storage/audio/file.mp3`
   - Server responds with the actual file

### Why This Approach?

✅ **Pros:**
- Simple for local development
- No external dependencies
- Fast file access
- Works offline
- Easy to debug

❌ **Cons:**
- Not scalable (files on server disk)
- Not suitable for production/cloud
- Path resolution issues across environments
- Files not accessible if server is down

## Alternative Approaches

### Option 1: Cloud Storage (Recommended for Production)

**Use AWS S3, Cloudinary, or similar:**

```typescript
// Upload to S3
const s3Url = await uploadToS3(fileBuffer, 'audio/filename.mp3')
// Store URL in database
scene.voiceUrl = s3Url // e.g., "https://bucket.s3.amazonaws.com/audio/file.mp3"
```

**Pros:**
- Scalable
- CDN support
- Reliable
- Works across environments

**Cons:**
- Requires cloud account
- Additional cost
- More complex setup

### Option 2: Base64 in Database (NOT Recommended)

Store files as base64 strings directly in MongoDB:

```typescript
const base64 = fileBuffer.toString('base64')
scene.voiceUrl = `data:audio/mpeg;base64,${base64}`
```

**Pros:**
- Everything in one place
- No file system needed

**Cons:**
- Database bloat (files make DB huge)
- Slow queries
- Memory issues
- Not practical for large files

### Option 3: Keep Current + Fix Paths (Current Solution)

Fix the path resolution so files are stored correctly, keep the architecture as-is for now.

## Current Implementation

- **Storage Location**: `D:\remotion\storage\` (project root)
- **Database**: Stores URLs like `/storage/audio/filename.mp3`
- **Frontend**: Accesses via `http://localhost:3001/storage/audio/filename.mp3`
- **API**: Serves files from `storage/` directory

## Migration Path

For production, you can:
1. Keep current architecture for MVP
2. Add S3/Cloudinary integration later
3. Migrate existing files to cloud storage
4. Update URLs in database

The database structure (storing URLs) remains the same, only the storage backend changes.

