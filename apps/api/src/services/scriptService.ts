import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables if not already loaded
const apiServicesDir = path.resolve(__dirname, "..");
const apiDir = path.resolve(apiServicesDir, "..");
const envPath = path.resolve(apiDir, ".env");

if (fs.existsSync(envPath) && !process.env.OPENAI_API_KEY) {
  dotenv.config({ path: envPath });
}

// Initialize OpenAI client
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null;

export async function generateScript(
  prompt: string,
  options: {
    aspectRatio?: string;
    tone?: string;
    targetLengthSeconds?: number;
    voiceoverProvider?: string;
    voiceoverVoiceId?: string;
  }
): Promise<Array<{ text: string; duration: number; keywords: string[] }>> {
  console.log(
    "Generating script for prompt:",
    prompt,
    "with options:",
    options
  );

  // Check if OpenAI API key is configured
  if (!openai) {
    console.warn("⚠️ OPENAI_API_KEY not set. Using fallback stub implementation.");
    // Fallback to stub implementation
    return [
      {
        text: `Welcome! ${prompt || "This is an AI-generated video."}`,
        duration: 5,
        keywords: extractKeywords(
          `Welcome! ${prompt || "This is an AI-generated video."}`
        ),
      },
      {
        text: "In this video, we will explore the key concepts and ideas.",
        duration: 8,
        keywords: extractKeywords(
          "In this video, we will explore the key concepts and ideas."
        ),
      },
      {
        text: "Let's dive deeper into the details and see what we can learn.",
        duration: 10,
        keywords: extractKeywords(
          "Let's dive deeper into the details and see what we can learn."
        ),
      },
      {
        text: "Thank you for watching! Don't forget to like and subscribe.",
        duration: 5,
        keywords: extractKeywords(
          "Thank you for watching! Don't forget to like and subscribe."
        ),
      },
    ];
  }

  try {
    const targetLength = options.targetLengthSeconds || 60;
    const tone = options.tone || "informal";
    const aspectRatio = options.aspectRatio || "16:9";

    const systemPrompt = `You are a professional video script generator. Create a scene-by-scene script for a ${targetLength}s video with a ${tone} tone, optimized for ${aspectRatio} aspect ratio.

Requirements:
- Each scene should be 5-8 seconds long (aim for natural pacing)
- Total duration should be approximately ${targetLength} seconds
- Each scene should have engaging, natural dialogue
- For each scene, generate 2-3 relevant keywords for finding images/videos on Pexels
- Keywords should be specific and visual (e.g., "business meeting", "sunset beach", "city skyline")
- Return ONLY a valid JSON array, no markdown, no code blocks, no explanations

Return format (JSON array):
[
  {
    "text": "Scene dialogue text here",
    "duration": 8,
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]`;

    const userPrompt = prompt || "Create an engaging video script.";

    console.log("🤖 Calling OpenAI API for script generation...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using gpt-4o-mini for cost efficiency, can be changed to gpt-4
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }, // Request JSON format
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    console.log("✅ Received response from OpenAI");

    // Parse JSON response
    let parsedData: any;
    try {
      // Try to parse as JSON object first (in case it's wrapped)
      parsedData = JSON.parse(content);
      
      // Check if it's wrapped in a "scenes" or "result" key
      if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
        parsedData = parsedData.scenes;
      } else if (parsedData.result && Array.isArray(parsedData.result)) {
        parsedData = parsedData.result;
      } else if (Array.isArray(parsedData)) {
        // Already an array
      } else {
        // Try to find array in the object
        const arrayKey = Object.keys(parsedData).find(
          (key) => Array.isArray(parsedData[key])
        );
        if (arrayKey) {
          parsedData = parsedData[arrayKey];
        } else {
          throw new Error("No array found in response");
        }
      }
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response as JSON:", parseError);
      console.error("Response content:", content);
      // Fallback: try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(
          `Failed to parse OpenAI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        );
      }
    }

    // Validate and transform the response
    if (!Array.isArray(parsedData)) {
      throw new Error("OpenAI response is not an array");
    }

    const scenes = parsedData.map((scene: any, index: number) => {
      // Validate required fields
      if (!scene.text || typeof scene.text !== "string") {
        throw new Error(`Scene ${index} missing or invalid 'text' field`);
      }

      // Default duration if not provided
      let duration = scene.duration;
      if (!duration || typeof duration !== "number") {
        // Estimate duration based on text length (average speaking rate: ~150 words per minute)
        const wordCount = scene.text.split(/\s+/).length;
        duration = Math.max(5, Math.min(15, Math.ceil((wordCount / 150) * 60)));
      }

      // Ensure duration is within reasonable bounds
      duration = Math.max(3, Math.min(20, duration));

      // Extract keywords
      let keywords: string[] = [];
      if (Array.isArray(scene.keywords)) {
        keywords = scene.keywords.slice(0, 3); // Limit to 3 keywords
      } else if (scene.keywords && typeof scene.keywords === "string") {
        keywords = [scene.keywords];
      } else {
        // Fallback: extract keywords from text
        keywords = extractKeywords(scene.text);
      }

      return {
        text: scene.text.trim(),
        duration: Math.round(duration * 10) / 10, // Round to 1 decimal place
        keywords: keywords.slice(0, 3), // Ensure max 3 keywords
      };
    });

    // Validate total duration is reasonable
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
    if (totalDuration < targetLength * 0.5 || totalDuration > targetLength * 1.5) {
      console.warn(
        `⚠️ Total duration (${totalDuration}s) is far from target (${targetLength}s). Adjusting scene durations...`
      );
      // Scale durations to match target
      const scaleFactor = targetLength / totalDuration;
      scenes.forEach((scene) => {
        scene.duration = Math.round(scene.duration * scaleFactor * 10) / 10;
      });
    }

    console.log(
      `✅ Generated ${scenes.length} scenes with total duration: ${scenes.reduce((sum, s) => sum + s.duration, 0).toFixed(1)}s`
    );

    return scenes;
  } catch (error) {
    console.error("❌ Failed to generate script with OpenAI:", error);
    console.error("Falling back to stub implementation...");
    
    // Fallback to stub implementation on error
    return [
      {
        text: `Welcome! ${prompt || "This is an AI-generated video."}`,
        duration: 5,
        keywords: extractKeywords(
          `Welcome! ${prompt || "This is an AI-generated video."}`
        ),
      },
      {
        text: "In this video, we will explore the key concepts and ideas.",
        duration: 8,
        keywords: extractKeywords(
          "In this video, we will explore the key concepts and ideas."
        ),
      },
      {
        text: "Let's dive deeper into the details and see what we can learn.",
        duration: 10,
        keywords: extractKeywords(
          "Let's dive deeper into the details and see what we can learn."
        ),
      },
      {
        text: "Thank you for watching! Don't forget to like and subscribe.",
        duration: 5,
        keywords: extractKeywords(
          "Thank you for watching! Don't forget to like and subscribe."
        ),
      },
    ];
  }
}

// Helper function to extract keywords from text (simple implementation)
// TODO: Replace with AI-generated keywords
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - remove common words and extract meaningful terms
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "where",
    "when",
    "why",
    "how",
    "welcome",
    "thank",
    "watching",
    "forget",
    "like",
    "subscribe",
    "video",
    "videos",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word));

  // Return top 3 unique keywords
  return [...new Set(words)].slice(0, 3);
}
