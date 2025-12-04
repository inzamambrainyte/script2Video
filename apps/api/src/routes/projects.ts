import express, { Router } from "express";
import mongoose, { Types } from "mongoose";
import Project from "../models/Project.js";
import Scene from "../models/Scene.js";
import SceneAsset from "../models/SceneAsset.js";
import { generateScript } from "../services/scriptService.js";
import { generateVoiceover } from "../services/voiceoverService.js";
import { generateCaptions } from "../services/captionService.js";
import { searchPexelsFirst } from "../services/assetService.js";

const router: Router = express.Router();

// Create project
router.post("/", async (req, res) => {
  try {
    const { title, prompt, userId } = req.body;

    const project = new Project({
      title: title || "Untitled Project",
      prompt: prompt || "",
      userId: userId || "user_1", // TODO: Get from auth
      scenes: [],
    });

    await project.save();

    res.json({
      id: project._id.toString(),
      title: project.title,
      createdAt: project.createdAt,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get project
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate({
      path: "scenes",
      populate: {
        path: "assets",
        model: "SceneAsset",
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Ensure scenes and assets are properly formatted
    const formattedProject = {
      ...project.toObject(),
      scenes: (project.scenes as any[]).map((scene: any) => ({
        ...scene.toObject(),
        assets: (scene.assets || []).map((asset: any) => ({
          id: asset._id?.toString() || asset.id,
          type: asset.type,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl,
          name: asset.name,
          source: asset.source,
          x: asset.x ?? 0,
          y: asset.y ?? 0,
          width: asset.width ?? 100,
          height: asset.height ?? 100,
          scale: asset.scale ?? 1,
          rotation: asset.rotation ?? 0,
          opacity: asset.opacity ?? 1,
          zIndex: asset.zIndex ?? 0,
          startTime: asset.startTime,
          volume: asset.volume,
          animationType: asset.animationType || "fadeIn",
          animationDuration: asset.animationDuration ?? 1,
          animationDelay: asset.animationDelay ?? 0,
          animationEasing: asset.animationEasing || "easeOut",
        })),
      })),
    };

    res.json(formattedProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update project
router.put("/:id", async (req, res) => {
  try {
    const { title, prompt, scenes } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Update project title and prompt
    if (title !== undefined) project.title = title;
    if (prompt !== undefined) project.prompt = prompt;

    // Update scenes and assets if provided
    if (scenes && Array.isArray(scenes)) {
      const updatedSceneIds: string[] = [];

      for (const sceneData of scenes) {
        let scene: any;

        // Find or create scene
        if (sceneData.id) {
          // Try to find by ID (handle both ObjectId and string)
          try {
            scene = await Scene.findById(
              Types.ObjectId.isValid(sceneData.id)
                ? sceneData.id
                : new Types.ObjectId(sceneData.id)
            );
          } catch (e) {
            // If ID is invalid, create new scene
            scene = null;
          }
        }

        if (!scene) {
          // Create new scene if it doesn't exist
          scene = new Scene({
            projectId: project._id,
            text: sceneData.text || "",
            duration: sceneData.duration || 5,
            keywords: sceneData.keywords || [],
            transition: sceneData.transition || "fade",
            order: updatedSceneIds.length,
            assets: [],
          });
        } else {
          // Update existing scene
          scene.text = sceneData.text || scene.text;
          scene.duration = sceneData.duration ?? scene.duration;
          scene.keywords = sceneData.keywords || scene.keywords;
          scene.transition = sceneData.transition || scene.transition;
          scene.captionsUrl = sceneData.captionsUrl || scene.captionsUrl;
          scene.captionStyle = sceneData.captionStyle || scene.captionStyle;
        }

        await scene.save();
        updatedSceneIds.push(scene._id.toString());

        // Update assets for this scene
        if (sceneData.assets && Array.isArray(sceneData.assets)) {
          const updatedAssetIds: string[] = [];

          for (const assetData of sceneData.assets) {
            let asset: any;

            // Find or create asset
            if (assetData.id) {
              // Try to find by ID (handle both ObjectId and string)
              try {
                asset = await SceneAsset.findById(
                  Types.ObjectId.isValid(assetData.id)
                    ? assetData.id
                    : new Types.ObjectId(assetData.id)
                );
              } catch (e) {
                // If ID is invalid, create new asset
                asset = null;
              }
            }

            if (!asset) {
              // Create new asset if it doesn't exist
              asset = new SceneAsset({
                sceneId: scene._id,
                type: assetData.type || "image",
                url: assetData.url || "",
                thumbnailUrl: assetData.thumbnailUrl,
                name: assetData.name || "Asset",
                source: assetData.source || "upload",
                x: assetData.x ?? 0,
                y: assetData.y ?? 0,
                width: assetData.width ?? 100,
                height: assetData.height ?? 100,
                scale: assetData.scale ?? 1,
                rotation: assetData.rotation ?? 0,
                opacity: assetData.opacity ?? 1,
                zIndex: assetData.zIndex ?? 0,
                animationType: assetData.animationType || "fadeIn",
                animationDuration: assetData.animationDuration ?? 1,
                animationDelay: assetData.animationDelay ?? 0,
                animationEasing: assetData.animationEasing || "easeOut",
                startTime: assetData.startTime,
                volume: assetData.volume,
              });
            } else {
              // Update existing asset with all transform properties
              asset.type = assetData.type || asset.type;
              asset.url = assetData.url || asset.url;
              asset.thumbnailUrl = assetData.thumbnailUrl ?? asset.thumbnailUrl;
              asset.name = assetData.name || asset.name;
              asset.source = assetData.source || asset.source;

              // Transform properties
              asset.x = assetData.x ?? asset.x ?? 0;
              asset.y = assetData.y ?? asset.y ?? 0;
              asset.width = assetData.width ?? asset.width ?? 100;
              asset.height = assetData.height ?? asset.height ?? 100;
              asset.scale = assetData.scale ?? asset.scale ?? 1;
              asset.rotation = assetData.rotation ?? asset.rotation ?? 0;
              asset.opacity = assetData.opacity ?? asset.opacity ?? 1;
              asset.zIndex = assetData.zIndex ?? asset.zIndex ?? 0;

              // Animation properties
              asset.animationType =
                assetData.animationType || asset.animationType || "fadeIn";
              asset.animationDuration =
                assetData.animationDuration ?? asset.animationDuration ?? 1;
              asset.animationDelay =
                assetData.animationDelay ?? asset.animationDelay ?? 0;
              asset.animationEasing =
                assetData.animationEasing || asset.animationEasing || "easeOut";

              // Audio properties
              if (assetData.startTime !== undefined)
                asset.startTime = assetData.startTime;
              if (assetData.volume !== undefined)
                asset.volume = assetData.volume;
            }

            await asset.save();
            updatedAssetIds.push(asset._id);
          }

          // Update scene's assets array
          scene.assets = updatedAssetIds;
          await scene.save();
        }
      }

      // Update project's scenes array
      project.scenes = updatedSceneIds.map((id) => id as any);
    }

    await project.save();

    // Return updated project with populated scenes
    const updatedProject = await Project.findById(project._id).populate({
      path: "scenes",
      populate: {
        path: "assets",
        model: "SceneAsset",
      },
    });

    res.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Generate script
router.post("/:id/generate-script", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const {
      prompt,
      aspectRatio,
      tone,
      targetLengthSeconds,
      voiceoverProvider,
      voiceoverVoiceId,
    } = req.body;

    // Use provided prompt or fall back to project prompt
    const scriptPrompt = prompt || project.prompt;

    // Generate script using OpenAI (stub)
    const scenes = await generateScript(scriptPrompt, {
      aspectRatio: aspectRatio || "16:9",
      tone: tone || "informal",
      targetLengthSeconds: targetLengthSeconds || 60,
      voiceoverProvider: voiceoverProvider || "elevenlabs",
      voiceoverVoiceId: voiceoverVoiceId || "eleven_en_us_v1",
    });

    // Delete existing scenes and their assets
    const existingScenes = await Scene.find({ projectId: project._id });
    for (const scene of existingScenes) {
      await SceneAsset.deleteMany({ sceneId: scene._id });
    }
    await Scene.deleteMany({ projectId: project._id });

    // Create new scenes and automatically fetch multiple media assets from Pexels
    const createdScenes = await Promise.all(
      scenes.map(async (scene, index) => {
        // Create scene first
        const newScene = new Scene({
          projectId: project._id,
          text: scene.text,
          duration: scene.duration,
          keywords: scene.keywords || [],
          order: index,
        });
        await newScene.save();

        const sceneAssets: any[] = [];

        // Search Pexels for a mix of videos and images
        if (scene.keywords && scene.keywords.length > 0) {
          // Strategy: Get 1 video (background) + 1-2 images (overlay/foreground)
          let videoFound = false;
          let imagesFound = 0;
          const maxImages = 2; // Maximum images per scene

          // Try to get a video first (for background)
          for (const keyword of scene.keywords) {
            if (videoFound) break;

            const videoMedia = await searchPexelsFirst(keyword, {
              type: "video",
            });
            if (videoMedia) {
              const videoAsset = new SceneAsset({
                sceneId: newScene._id,
                type: "video",
                url: videoMedia.url,
                thumbnailUrl: videoMedia.thumbnailUrl,
                name: videoMedia.name || `Scene ${index + 1} Video`,
                source: "pexels",
                x: 0,
                y: 0,
                width: 100,
                height: 100,
                scale: 1,
                rotation: 0,
                opacity: 1,
                zIndex: 0, // Background video
                volume: 0, // Mute videos by default
                animationType: "fadeIn",
                animationDuration: 0.5,
                animationDelay: 0,
                animationEasing: "easeOut",
              });
              await videoAsset.save();
              sceneAssets.push(videoAsset);
              videoFound = true;
              console.log(
                `✅ Found video for scene ${
                  index + 1
                } using keyword "${keyword}": ${videoMedia.url}`
              );
            }
          }

          // Always try to get images (even if video was found)
          // Use different keywords for images to get variety
          const imageKeywords = scene.keywords.slice(
            videoFound ? 1 : 0,
            videoFound ? 3 : 3
          );

          for (
            let i = 0;
            i < imageKeywords.length && imagesFound < maxImages;
            i++
          ) {
            const imageMedia = await searchPexelsFirst(imageKeywords[i], {
              type: "image",
            });
            if (imageMedia) {
              // Choose animation based on image position
              const animations = [
                "fadeIn",
                "slideInLeft",
                "slideInRight",
                "zoomIn",
              ];
              const selectedAnimation =
                animations[imagesFound % animations.length];

              // Position images as overlays if video exists, or side-by-side if no video
              const imageAsset = new SceneAsset({
                sceneId: newScene._id,
                type: "image",
                url: imageMedia.url,
                thumbnailUrl: imageMedia.thumbnailUrl,
                name:
                  imageMedia.name ||
                  `Scene ${index + 1} Image ${imagesFound + 1}`,
                source: "pexels",
                x: videoFound
                  ? imagesFound === 0
                    ? 10
                    : 60 // Overlay positions if video exists
                  : imagesFound === 0
                  ? 0
                  : 50, // Side-by-side if no video
                y: videoFound ? 10 : 0, // Slight offset if video exists
                width: videoFound
                  ? imagesFound === 0
                    ? 40
                    : 30 // Smaller overlays if video exists
                  : imagesFound === 0
                  ? 50
                  : 50, // Half width if no video
                height: videoFound ? 40 : 100, // Smaller if video exists
                scale: 1,
                rotation: 0,
                opacity: videoFound ? 0.9 : imagesFound === 0 ? 1 : 0.7, // Slightly transparent if video exists
                zIndex: videoFound ? imagesFound + 1 : imagesFound, // Images above video
                animationType: selectedAnimation,
                animationDuration: 1,
                animationDelay: (imagesFound + (videoFound ? 0.3 : 0)) * 0.2, // Stagger animations
                animationEasing: "easeOut",
              });
              await imageAsset.save();
              sceneAssets.push(imageAsset);
              imagesFound++;
              console.log(
                `✅ Found image ${imagesFound} for scene ${
                  index + 1
                } using keyword "${imageKeywords[i]}": ${imageMedia.url}`
              );
            }
          }

          // If no video found and no images found, try fallback
          if (sceneAssets.length === 0) {
            for (const keyword of scene.keywords) {
              const media = await searchPexelsFirst(keyword, {
                type: "image", // Default to image
              });
              if (media) {
                const asset = new SceneAsset({
                  sceneId: newScene._id,
                  type: "image",
                  url: media.url,
                  thumbnailUrl: media.thumbnailUrl,
                  name: media.name || `Scene ${index + 1} Media`,
                  source: "pexels",
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 100,
                  scale: 1,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 0,
                  animationType: "fadeIn",
                  animationDuration: 1,
                  animationDelay: 0,
                  animationEasing: "easeOut",
                });
                await asset.save();
                sceneAssets.push(asset);
                console.log(
                  `✅ Found fallback media for scene ${
                    index + 1
                  } using keyword "${keyword}": ${media.url}`
                );
                break;
              }
            }
          }

          // Fallback: If still no assets, try any keyword with any type
          if (sceneAssets.length === 0) {
            for (const keyword of scene.keywords) {
              const media = await searchPexelsFirst(keyword, {
                type: "image", // Default to image
              });
              if (media) {
                const asset = new SceneAsset({
                  sceneId: newScene._id,
                  type: "image",
                  url: media.url,
                  thumbnailUrl: media.thumbnailUrl,
                  name: media.name || `Scene ${index + 1} Media`,
                  source: "pexels",
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 100,
                  scale: 1,
                  rotation: 0,
                  opacity: 1,
                  zIndex: 0,
                  animationType: "fadeIn",
                  animationDuration: 1,
                  animationDelay: 0,
                  animationEasing: "easeOut",
                });
                await asset.save();
                sceneAssets.push(asset);
                console.log(
                  `✅ Found fallback media for scene ${
                    index + 1
                  } using keyword "${keyword}": ${media.url}`
                );
                break;
              }
            }
          }
        }

        // Update scene with assets
        if (sceneAssets.length > 0) {
          newScene.assets = sceneAssets.map((a) => a._id);
          // Set first asset as mediaUrl for backward compatibility
          newScene.mediaUrl = sceneAssets[0].url;
          await newScene.save();
        }

        return newScene;
      })
    );

    // Refresh project to avoid version conflicts
    const refreshedProject = await Project.findById(project._id);
    if (!refreshedProject) {
      return res.status(404).json({ error: "Project not found" });
    }

    refreshedProject.scenes = createdScenes.map((s) => s._id);
    await refreshedProject.save();

    // Populate assets for response
    const scenesWithAssets = await Promise.all(
      createdScenes.map(async (s) => {
        const scene = await Scene.findById(s._id).populate("assets");
        return {
          id: scene!._id.toString(),
          text: scene!.text,
          duration: scene!.duration,
          keywords: scene!.keywords,
          assets: (scene!.assets as any[]).map((a) => ({
            id: a._id.toString(),
            type: a.type,
            url: a.url,
            thumbnailUrl: a.thumbnailUrl,
            name: a.name,
            source: a.source,
            x: a.x,
            y: a.y,
            width: a.width,
            height: a.height,
            scale: a.scale,
            rotation: a.rotation,
            opacity: a.opacity,
            zIndex: a.zIndex,
            startTime: a.startTime,
            volume: a.volume,
            animationType: a.animationType,
            animationDuration: a.animationDuration,
            animationDelay: a.animationDelay,
            animationEasing: a.animationEasing,
          })),
          mediaUrl: scene!.mediaUrl, // Backward compatibility
          voiceUrl: scene!.voiceUrl,
          captionsUrl: scene!.captionsUrl,
          captionStyle: scene!.captionStyle || {},
          sfxUrls: (scene as any).sfxUrls || [],
        };
      })
    );

    res.json({
      scenes: scenesWithAssets,
    });
  } catch (error) {
    console.error("Error generating script:", error);
    res.status(500).json({ error: "Failed to generate script" });
  }
});

// Generate voiceover
router.post("/:id/voiceover", async (req, res) => {
  try {
    const { sceneId, provider, voiceId, model, autoAdjustDuration } = req.body;
    const scene = await Scene.findById(sceneId);

    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    // Generate voiceover with selected provider
    const voiceoverResult = await generateVoiceover(scene.text, {
      provider: provider || "elevenlabs", // Default to elevenlabs
      voiceId: voiceId || (provider === "openai" ? "alloy" : "eleven_en_us_v1"),
      model: model || (provider === "openai" ? "tts-1" : undefined),
    });

    scene.voiceUrl = voiceoverResult.url;

    // Auto-adjust scene duration to match voiceover length (if enabled)
    if (autoAdjustDuration !== false) {
      // Default to true
      const oldDuration = scene.duration;
      scene.duration = Math.ceil(voiceoverResult.duration); // Round up to nearest second
      console.log(
        `⏱️ Updated scene duration from ${oldDuration}s to ${
          scene.duration
        }s (voiceover: ${voiceoverResult.duration.toFixed(2)}s)`
      );
    }

    await scene.save();

    res.json({
      voiceUrl: voiceoverResult.url,
      duration: voiceoverResult.duration,
      sceneDuration: scene.duration,
    });
  } catch (error) {
    console.error("Error generating voiceover:", error);
    res.status(500).json({ error: "Failed to generate voiceover" });
  }
});

// Update single scene script
router.post("/:id/scenes/:sceneId/update-script", async (req, res) => {
  try {
    const { text } = req.body;
    const { sceneId } = req.params;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Text is required" });
    }

    const scene = await Scene.findById(sceneId);
    if (!scene) {
      return res.status(404).json({ error: "Scene not found" });
    }

    // Update scene text
    scene.text = text.trim();

    // Optionally regenerate keywords using OpenAI
    try {
      const { generateScript } = await import("../services/scriptService.js");
      // Generate keywords for the new text
      const scriptService = await import("../services/scriptService.js");
      // For now, just update the text. Keywords can be regenerated if needed.
      // You could call OpenAI to extract keywords from the new text here.
    } catch (error) {
      console.warn("Could not regenerate keywords:", error);
    }

    await scene.save();

    res.json({
      id: scene._id.toString(),
      text: scene.text,
      keywords: scene.keywords,
      duration: scene.duration,
    });
  } catch (error) {
    console.error("Error updating scene script:", error);
    res.status(500).json({ error: "Failed to update scene script" });
  }
});

// Generate captions
router.post("/:id/captions", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("scenes");
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Generate captions for all scenes
    const scenes = project.scenes as any[];
    const captions = await generateCaptions(
      scenes.map((s) => ({
        _id: s._id,
        text: s.text,
        voiceUrl: s.voiceUrl,
        duration: s.duration,
      }))
    );

    // Update scenes with captions
    for (const scene of scenes) {
      const sceneId = scene._id.toString();
      if (captions[sceneId]) {
        scene.captionsUrl = captions[sceneId];
        await scene.save();
      }
    }

    res.json({ success: true, captions });
  } catch (error) {
    console.error("Error generating captions:", error);
    res.status(500).json({ error: "Failed to generate captions" });
  }
});

export default router;
