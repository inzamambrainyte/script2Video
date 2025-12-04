import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import RenderJob from "../models/RenderJob.js";
import Project from "../models/Project.js";
import Scene from "../models/Scene.js";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process a render job
 * This would typically be called by a BullMQ worker
 */
export async function processRenderJob(jobId: string): Promise<void> {
  const job = await RenderJob.findById(jobId).populate("projectId");
  if (!job) {
    throw new Error(`Render job ${jobId} not found`);
  }

  const project = job.projectId as any;
  if (!project) {
    throw new Error(`Project not found for job ${jobId}`);
  }

  // Update status
  job.status = "processing";
  job.progress = 0;
  await job.save();

  // Declare tempScenesFile outside try block so it's accessible in catch block
  let tempScenesFile: string | null = null;

  try {
    // Find project root first (needed for path resolution)
    let projectRoot = __dirname;
    while (
      !fs.existsSync(path.join(projectRoot, "pnpm-workspace.yaml")) &&
      projectRoot !== path.dirname(projectRoot)
    ) {
      projectRoot = path.dirname(projectRoot);
    }

    // Fetch scenes with assets
    const scenes = await Scene.find({ projectId: project._id })
      .populate("assets")
      .sort({ order: 1 });

    // Get API URL for asset URLs
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";
    const storagePath = process.env.STORAGE_PATH || "./storage";

    // Prepare scenes data for renderer
    const scenesData = scenes.map((scene: any) => {
      // Convert assets to render format
      const assets = (scene.assets || []).map((asset: any) => ({
        id: asset._id.toString(),
        type: asset.type,
        url: asset.url.startsWith("http")
          ? asset.url
          : asset.url.startsWith("/storage")
          ? `${apiUrl}${asset.url}`
          : `${apiUrl}/storage/${asset.url}`,
        thumbnailUrl: asset.thumbnailUrl,
        name: asset.name,
        source: asset.source,
        x: asset.x || 0,
        y: asset.y || 0,
        width: asset.width || 100,
        height: asset.height || 100,
        scale: asset.scale || 1,
        rotation: asset.rotation || 0,
        opacity: asset.opacity ?? 1,
        zIndex: asset.zIndex || 0,
        animationType: asset.animationType || "fadeIn",
        animationDuration: asset.animationDuration || 1,
        animationDelay: asset.animationDelay || 0,
        animationEasing: asset.animationEasing || "easeOut",
      }));

      // Find voiceover audio asset
      const voiceoverAsset = assets.find((a: any) => a.type === "audio");
      const voiceUrl = voiceoverAsset
        ? voiceoverAsset.url
        : scene.voiceUrl
        ? scene.voiceUrl.startsWith("http")
          ? scene.voiceUrl
          : `${apiUrl}${scene.voiceUrl}`
        : null;

      return {
        id: scene._id.toString(),
        text: scene.text,
        duration: scene.duration,
        assets: assets,
        mediaUrl: scene.mediaUrl || null, // Backward compatibility
        voiceUrl: voiceUrl,
        captionsUrl: scene.captionsUrl
          ? scene.captionsUrl.startsWith("http")
            ? scene.captionsUrl
            : `${apiUrl}${scene.captionsUrl}`
          : null,
        captionStyle: scene.captionStyle || {},
        sfxUrls: (scene.sfxUrls || []).map((url: string) =>
          url.startsWith("http") ? url : `${apiUrl}${url}`
        ),
        transition: scene.transition || "fade",
      };
    });

    // Prepare output path (ensure absolute path)
    const outputDir = path.isAbsolute(storagePath)
      ? path.join(storagePath, "renders")
      : path.resolve(projectRoot, storagePath, "renders");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use absolute path for output
    const outputPath = path.join(outputDir, `render_${jobId}.mp4`);

    // Call Remotion renderer
    // Calculate renderer path: from apps/api/src/workers -> root/renderer/render.js
    // __dirname is apps/api/src/workers (or apps/api/dist/workers when compiled)
    // Go up to root: ../../.. (workers -> src -> api -> apps -> root)
    // Then to renderer/render.js
    // In dev: apps/api/src/workers -> ../../.. -> apps -> .. -> root -> renderer/render.js
    // In prod: apps/api/dist/workers -> ../../.. -> apps -> .. -> root -> renderer/render.js
    const rendererPath = path.resolve(
      __dirname,
      "../../../../renderer/render.js"
    );

    // Alternative: Use project root detection (projectRoot already found above)
    const alternativePath = path.join(projectRoot, "renderer", "render.js");

    // Use the alternative path if it exists, otherwise use the calculated path
    const finalRendererPath = fs.existsSync(alternativePath)
      ? alternativePath
      : rendererPath;

    // Verify render script exists
    if (!fs.existsSync(finalRendererPath)) {
      throw new Error(
        `Render script not found. Tried:\n- ${rendererPath}\n- ${alternativePath}\nCurrent __dirname: ${__dirname}`
      );
    }

    // Write scenes JSON to a temporary file to avoid shell escaping issues
    // This is especially important on Windows where URLs with query params can be misinterpreted
    // Use absolute path so it works regardless of working directory
    tempScenesFile = path.isAbsolute(storagePath)
      ? path.join(storagePath, "renders", `scenes_${jobId}.json`)
      : path.resolve(
          projectRoot,
          storagePath,
          "renders",
          `scenes_${jobId}.json`
        );

    // Ensure the directory exists
    const tempScenesDir = path.dirname(tempScenesFile);
    if (!fs.existsSync(tempScenesDir)) {
      fs.mkdirSync(tempScenesDir, { recursive: true });
    }

    fs.writeFileSync(tempScenesFile, JSON.stringify(scenesData), "utf-8");
    console.log(`💾 Wrote scenes to: ${tempScenesFile}`);

    console.log(`🎬 Starting render for job ${jobId}`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📄 Render script: ${finalRendererPath}`);
    console.log(`📂 __dirname: ${__dirname}`);
    console.log(`📋 Scenes file: ${tempScenesFile}`);

    // Execute render script
    // Try pnpm exec first, but fall back to direct node if pnpm is not available
    const isWindows = process.platform === "win32";
    const nodeExecutable = process.execPath || "node";

    // Check if we should use pnpm exec or direct node
    // For now, let's try direct node with NODE_PATH set to help with module resolution
    const args = [
      finalRendererPath,
      project._id.toString(),
      outputPath,
      tempScenesFile,
    ];

    console.log(`🔧 Using: ${nodeExecutable}`);
    console.log(`📝 Script: ${finalRendererPath}`);
    console.log(`📂 Working directory: ${path.dirname(finalRendererPath)}`);
    console.log(`📋 Args: ${args.slice(1).join(" ")}`);

    await new Promise<void>((resolve, reject) => {
      let child;

      // Set NODE_PATH to include workspace node_modules for dependency resolution
      const nodePath = [
        path.join(projectRoot, "node_modules"),
        path.join(projectRoot, "renderer", "node_modules"),
        path.join(__dirname, "../../../../node_modules"),
        process.env.NODE_PATH || "",
      ]
        .filter(Boolean)
        .join(path.delimiter);

      const env = {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || "development",
        NODE_PATH: nodePath,
      };

      if (isWindows && nodeExecutable.includes(" ")) {
        // Windows with spaces in path: construct full command string with proper quoting
        const escapeArg = (arg: string) => `"${arg.replace(/"/g, '\\"')}"`;
        const quotedNode = escapeArg(nodeExecutable);
        const quotedArgs = args.map(escapeArg).join(" ");
        const command = `${quotedNode} ${quotedArgs}`;

        console.log(`🚀 Executing: ${command}`);

        child = spawn(command, {
          stdio: ["ignore", "pipe", "pipe"], // Don't inherit stdin, capture stdout/stderr
          cwd: path.dirname(finalRendererPath), // Run from renderer directory
          shell: true,
          env,
        });
      } else {
        // Unix or Windows without spaces: use array format
        console.log(`🚀 Executing: ${nodeExecutable} ${args.join(" ")}`);

        child = spawn(nodeExecutable, args, {
          stdio: ["ignore", "pipe", "pipe"], // Don't inherit stdin, capture stdout/stderr
          cwd: path.dirname(finalRendererPath), // Run from renderer directory
          shell: isWindows,
          env,
        });
      }

      // Log when process starts
      console.log(`✅ Render process started (PID: ${child.pid})`);

      // Add timeout to prevent hanging (30 minutes for video rendering)
      const timeout = setTimeout(() => {
        console.error("⏰ Render process timeout - killing process");
        child.kill("SIGTERM");
        setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
        }, 5000);
        reject(new Error("Render process timed out after 30 minutes"));
      }, 30 * 60 * 1000); // 30 minutes timeout

      // Capture and log stdout/stderr immediately
      if (child.stdout) {
        child.stdout.on("data", (data) => {
          const output = data.toString();
          // Write directly to process stdout so we see it in real-time
          process.stdout.write(`[Render] ${output}`);
        });
      }
      if (child.stderr) {
        child.stderr.on("data", (data) => {
          const output = data.toString();
          // Write directly to process stderr so we see it in real-time
          process.stderr.write(`[Render Error] ${output}`);
        });
      }

      child.on("close", (code, signal) => {
        clearTimeout(timeout);
        console.log(
          `🔚 Render process closed (code: ${code}, signal: ${signal})`
        );
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Render process exited with code ${code}${
                signal ? ` (signal: ${signal})` : ""
              }`
            )
          );
        }
      });

      child.on("error", (error) => {
        clearTimeout(timeout);
        console.error(`❌ Render process error:`, error);
        reject(error);
      });
    });

    // Update job with result
    job.status = "completed";
    job.progress = 100;
    job.resultUrl = `/storage/renders/render_${jobId}.mp4`;
    job.completedAt = new Date();
    await job.save();

    console.log(`✅ Render completed for job ${jobId}`);

    // Clean up temporary scenes file
    try {
      if (fs.existsSync(tempScenesFile)) {
        fs.unlinkSync(tempScenesFile);
        console.log(`🗑️ Cleaned up temp file: ${tempScenesFile}`);
      }
    } catch (cleanupError) {
      console.warn(
        `⚠️ Failed to cleanup temp file ${tempScenesFile}:`,
        cleanupError
      );
    }
  } catch (error) {
    console.error(`❌ Render failed for job ${jobId}:`, error);

    // Clean up temporary scenes file on error too
    try {
      if (tempScenesFile && fs.existsSync(tempScenesFile)) {
        fs.unlinkSync(tempScenesFile);
      }
    } catch (cleanupError) {
      console.warn(
        `⚠️ Failed to cleanup temp file ${tempScenesFile}:`,
        cleanupError
      );
    }

    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Unknown error";
    await job.save();

    throw error;
  }
}
