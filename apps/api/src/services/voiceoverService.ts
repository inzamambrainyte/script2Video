import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables if not already loaded
// This ensures the service can access env vars even if dotenv wasn't called in server.ts
const apiServicesDir = path.resolve(__dirname, ".."); // apps/api/src/services -> apps/api/src
const apiDir = path.resolve(apiServicesDir, ".."); // apps/api/src -> apps/api
const envPath = path.resolve(apiDir, ".env");

// Only load if .env exists and hasn't been loaded yet
if (fs.existsSync(envPath) && !process.env.OPENAI_API_KEY) {
  dotenv.config({ path: envPath });
}

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
console.log(
  "🔑 OpenAI API Key loaded:",
  openaiApiKey ? `${openaiApiKey.substring(0, 7)}...` : "NOT SET"
);

const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

export type VoiceoverProvider = "openai" | "elevenlabs";

export interface VoiceoverOptions {
  provider: VoiceoverProvider;
  voiceId?: string;
  model?: string; // For OpenAI
}

export interface VoiceoverResult {
  url: string;
  duration: number; // Duration in seconds
}

// Helper function to get storage path (consistent with server.ts)
// IMPORTANT: Files are stored on disk, but URLs are stored in the database
// This allows the frontend to access files via HTTP URLs served by the API
function getStoragePath() {
  const storagePath = process.env.STORAGE_PATH || "./storage";

  // Server.ts uses: path.resolve(__dirname, '../..') where __dirname is apps/api/src
  // But that actually gives: apps/api/src -> .. -> apps/api -> .. -> apps (WRONG!)
  // We need to go up 3 levels from apps/api/src to get to project root
  // OR: from apps/api/src, go up to apps/api, then up to project root (2 levels total)

  // From apps/api/src/services: go up to apps/api/src, then up 3 levels total
  const apiSrcDir = path.resolve(__dirname, ".."); // apps/api/src/services -> apps/api/src
  const apiDir = path.resolve(apiSrcDir, ".."); // apps/api/src -> apps/api
  const projectRoot = path.resolve(apiDir, ".."); // apps/api -> remotion (project root)

  const resolved = path.isAbsolute(storagePath)
    ? storagePath
    : path.resolve(projectRoot, storagePath);

  return resolved;
}

// Get audio duration using ffprobe (if available) or estimate from file size
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    // Try using ffprobe if available
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
    );
    const duration = parseFloat(stdout.trim());
    if (!isNaN(duration) && duration > 0) {
      return duration;
    }
  } catch (error) {
    // ffprobe not available or failed, estimate from file size
    console.log("⚠️ ffprobe not available, estimating duration from file size");
  }

  // Fallback: Estimate duration from file size
  // Average MP3 bitrate is ~128kbps, so duration ≈ (fileSize * 8) / (bitrate * 1000)
  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  const estimatedBitrate = 128000; // 128 kbps
  const estimatedDuration = (fileSizeBytes * 8) / estimatedBitrate;

  console.log(
    `📊 Estimated audio duration: ${estimatedDuration.toFixed(
      2
    )}s (from file size: ${fileSizeBytes} bytes)`
  );
  return estimatedDuration;
}

// Generate voiceover using OpenAI TTS
async function generateOpenAIVoiceover(
  text: string,
  options: VoiceoverOptions
): Promise<VoiceoverResult> {
  // Use the same path resolution as server.ts
  const resolvedStoragePath = getStoragePath();
  const audioDir = path.join(resolvedStoragePath, "audio");

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const filename = `voice_openai_${Date.now()}.mp3`;
  const filePath = path.join(audioDir, filename);

  console.log(
    "Generating OpenAI voiceover for text:",
    text.substring(0, 50) + "...",
    "with model:",
    options.model || "tts-1",
    "voice:",
    options.voiceId || "alloy"
  );

  // Check if OpenAI API key is configured
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY not set. Creating placeholder file.");
    // Create a placeholder file for stub (empty MP3 header)
    const placeholderMp3 = Buffer.from([
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 sync word and header
    ]);
    fs.writeFileSync(filePath, placeholderMp3);
    console.log(`✅ Created placeholder audio file: ${filePath}`);
    // Estimate duration for placeholder (use scene text length)
    const estimatedDuration = Math.max(3, text.length / 10); // Rough estimate: 10 chars per second
    return {
      url: `/storage/audio/${filename}`,
      duration: estimatedDuration,
    };
  }

  try {
    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: (options.model || "tts-1") as "tts-1" | "tts-1-hd",
      voice: (options.voiceId || "alloy") as
        | "alloy"
        | "echo"
        | "fable"
        | "onyx"
        | "nova"
        | "shimmer",
      input: text,
    });

    // Convert response to buffer and save
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const stats = fs.statSync(filePath);
    console.log(`✅ Generated OpenAI voiceover: ${filePath}`);
    console.log(`📊 File size: ${stats.size} bytes`);
    console.log(`📂 File URL will be: /storage/audio/${filename}`);

    // Get actual audio duration
    const duration = await getAudioDuration(filePath);
    console.log(`⏱️ Audio duration: ${duration.toFixed(2)}s`);

    return {
      url: `/storage/audio/${filename}`,
      duration: duration,
    };
  } catch (error) {
    console.error(`❌ Failed to generate OpenAI voiceover:`, error);
    // Fallback to placeholder if API call fails
    const placeholderMp3 = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    fs.writeFileSync(filePath, placeholderMp3);
    throw new Error(
      `OpenAI TTS generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Generate voiceover using ElevenLabs TTS
async function generateElevenLabsVoiceover(
  text: string,
  options: VoiceoverOptions
): Promise<VoiceoverResult> {
  // Use the same path resolution as server.ts
  const resolvedStoragePath = getStoragePath();
  const audioDir = path.join(resolvedStoragePath, "audio");

  if (!fs.existsSync(audioDir)) {
    fs.mkdirSync(audioDir, { recursive: true });
  }

  const filename = `voice_elevenlabs_${Date.now()}.mp3`;
  const filePath = path.join(audioDir, filename);

  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = options.voiceId || "eleven_en_us_v1";

  console.log(
    "Generating ElevenLabs voiceover for text:",
    text.substring(0, 50) + "...",
    "with voice:",
    voiceId
  );

  // Check if ElevenLabs API key is configured
  if (!elevenlabsApiKey) {
    console.warn("⚠️ ELEVENLABS_API_KEY not set. Creating placeholder file.");
    // Create a placeholder file for stub (empty MP3 header)
    const placeholderMp3 = Buffer.from([
      0xff,
      0xfb,
      0x90,
      0x00, // MP3 sync word and header
    ]);
    fs.writeFileSync(filePath, placeholderMp3);
    console.log(`✅ Created placeholder audio file: ${filePath}`);
    // Estimate duration for placeholder (use scene text length)
    const estimatedDuration = Math.max(3, text.length / 10); // Rough estimate: 10 chars per second
    return {
      url: `/storage/audio/${filename}`,
      duration: estimatedDuration,
    };
  }

  try {
    // Call ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenlabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Convert response to buffer and save
    const audioBuffer = await response.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(audioBuffer));

    const stats = fs.statSync(filePath);
    console.log(`✅ Generated ElevenLabs voiceover: ${filePath}`);
    console.log(`📊 File size: ${stats.size} bytes`);
    console.log(`📂 File URL will be: /storage/audio/${filename}`);

    // Get actual audio duration
    const duration = await getAudioDuration(filePath);
    console.log(`⏱️ Audio duration: ${duration.toFixed(2)}s`);

    return {
      url: `/storage/audio/${filename}`,
      duration: duration,
    };
  } catch (error) {
    console.error(`❌ Failed to generate ElevenLabs voiceover:`, error);
    // Fallback to placeholder if API call fails
    const placeholderMp3 = Buffer.from([0xff, 0xfb, 0x90, 0x00]);
    fs.writeFileSync(filePath, placeholderMp3);
    throw new Error(
      `ElevenLabs TTS generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Main voiceover generation function
export async function generateVoiceover(
  text: string,
  options: VoiceoverOptions
): Promise<VoiceoverResult> {
  if (options.provider === "openai") {
    return generateOpenAIVoiceover(text, options);
  } else if (options.provider === "elevenlabs") {
    return generateElevenLabsVoiceover(text, options);
  } else {
    throw new Error(`Unsupported voiceover provider: ${options.provider}`);
  }
}
