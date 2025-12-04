"use client";

import { useState, useEffect } from "react";
import ScenesPanel from "@/components/ScenesPanel";
import CanvasPreview from "@/components/CanvasPreview";
import AssetsPanel from "@/components/AssetsPanel";
import LayersPanel from "@/components/LayersPanel";
import TransformControls from "@/components/TransformControls";
import CaptionTransformControls from "@/components/CaptionTransformControls";
import Topbar from "@/components/Topbar";
import GenerateScriptModal from "@/components/GenerateScriptModal";
import CommonPanel from "@/components/CommonPanel";
import ResizableSidebar from "@/components/ResizableSidebar";
import ResizableSplitPanel from "@/components/ResizableSplitPanel";
import { Project, Scene, SceneAsset } from "@/types";
import { getStorageUrl } from "@/lib/api";

export default function CreatePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isCaptionSelected, setIsCaptionSelected] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCommonPanel, setShowCommonPanel] = useState(false);

  // Load or create project on mount
  useEffect(() => {
    const loadOrCreateProject = async () => {
      try {
        // Try to get project from URL params or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get("id");

        if (projectId) {
          // Load existing project
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
            }/api/v1/projects/${projectId}`
          );
          if (response.ok) {
            const data = await response.json();
            setProject({
              id: data._id || data.id,
              title: data.title,
              prompt: data.prompt || "",
              createdAt: data.createdAt,
              userId: data.userId,
            });
            // Load scenes if they exist
            if (data.scenes && Array.isArray(data.scenes)) {
              setScenes(
                data.scenes.map((s: any) => ({
                  id: s._id?.toString() || s.id,
                  text: s.text,
                  duration: s.duration,
                  keywords: s.keywords || [],
                  assets:
                    s.assets
                      ?.map((a: any) => {
                        // Handle both populated objects and ObjectIds
                        if (typeof a === "string" || a._id) {
                          // If it's an ObjectId string or has _id, it might not be populated
                          // Skip it for now - we'll need to fetch separately if needed
                          return null;
                        }
                        return {
                          id: a._id?.toString() || a.id,
                          type: a.type,
                          url: a.url,
                          thumbnailUrl: a.thumbnailUrl,
                          name: a.name,
                          source: a.source,
                          x: a.x ?? 0,
                          y: a.y ?? 0,
                          width: a.width ?? 100,
                          height: a.height ?? 100,
                          scale: a.scale ?? 1,
                          rotation: a.rotation ?? 0,
                          opacity: a.opacity ?? 1,
                          zIndex: a.zIndex ?? 0,
                          startTime: a.startTime,
                          volume: a.volume,
                          animationType: a.animationType || "fadeIn",
                          animationDuration: a.animationDuration ?? 1,
                          animationDelay: a.animationDelay ?? 0,
                          animationEasing: a.animationEasing || "easeOut",
                        };
                      })
                      .filter((a: any) => a !== null) || [],
                  mediaUrl: s.mediaUrl, // Backward compatibility
                  voiceUrl: s.voiceUrl, // Backward compatibility
                  captionsUrl: s.captionsUrl,
                  captionStyle: s.captionStyle || {},
                  sfxUrls: s.sfxUrls || [],
                }))
              );
            }
          }
        } else {
          // Create new project
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
            }/api/v1/projects`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: "Untitled Project",
                prompt: "",
                userId: "user_1",
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            setProject({
              id: data.id,
              title: data.title,
              prompt: "",
              createdAt: data.createdAt,
              userId: "user_1",
            });
            // Update URL with project ID
            window.history.replaceState({}, "", `?id=${data.id}`);
          }
        }
      } catch (error) {
        console.error("Failed to load/create project:", error);
      }
    };

    loadOrCreateProject();
  }, []);

  const handleOpenModal = () => {
    if (!project?.id) {
      alert("Please wait for the project to load...");
      return;
    }
    setIsModalOpen(true);
  };

  const handleScriptGenerated = (newScenes: Scene[]) => {
    setScenes(newScenes);
    setIsModalOpen(false);
  };

  const handleUpdateSceneScript = async (sceneId: string, newText: string) => {
    if (!project?.id) {
      alert("Project not loaded");
      return;
    }

    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) {
      alert("Scene not found");
      return;
    }

    if (!newText || newText.trim() === "") {
      alert("Script text cannot be empty");
      return;
    }

    try {
      // Call API to update scene script
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${project.id}/scenes/${sceneId}/update-script`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: newText.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the scene in local state
        setScenes((prev) =>
          prev.map((s) =>
            s.id === sceneId
              ? {
                  ...s,
                  text: data.text || newText.trim(),
                  keywords: data.keywords || s.keywords,
                }
              : s
          )
        );
        // Success - editing state will be cleared by ScenesPanel
      } else {
        const errorData = await response.json();
        alert(`Failed to update script: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to update scene script:", error);
      alert("Failed to update scene script. Please try again.");
    }
  };

  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState<string | null>(null);

  const handleRegenerateVoiceover = async (sceneId: string) => {
    if (!project?.id) {
      alert("Project not loaded");
      return;
    }

    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) {
      alert("Scene not found");
      return;
    }

    if (!scene.text || scene.text.trim() === "") {
      alert("Scene script is empty. Please add script text first.");
      return;
    }

    setIsGeneratingVoiceover(sceneId);

    try {
      // Call API to generate voiceover
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${project.id}/voiceover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneId: sceneId,
            provider: "elevenlabs", // Default to ElevenLabs
            voiceId: "eleven_en_us_v1", // Default voice
            autoAdjustDuration: true,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Find existing voiceover asset and update it, or create new one
        const existingVoiceoverAsset = scene.assets?.find(
          (a) => a.type === "audio"
        );

        if (existingVoiceoverAsset) {
          // Update existing voiceover asset
          handleUpdateAsset(existingVoiceoverAsset.id, {
            url: data.voiceUrl,
          });
        } else {
          // Create new voiceover asset
          const voiceoverAsset: SceneAsset = {
            id: `asset_${Date.now()}`,
            type: "audio",
            url: data.voiceUrl,
            name: "Voiceover (ElevenLabs)",
            source: "generated",
            startTime: 0,
            volume: 1,
            opacity: 0, // Audio files hidden by default
            zIndex: scene.assets?.length || 0,
          };

          handleUpdateScene(sceneId, {
            assets: [...(scene.assets || []), voiceoverAsset],
          });
        }

        // Update scene with voiceover URL and duration
        const newDuration = data.sceneDuration || scene.duration || 5;
        const validDuration = newDuration > 0 && isFinite(newDuration) ? newDuration : 5;
        
        handleUpdateScene(sceneId, {
          voiceUrl: data.voiceUrl,
          duration: validDuration,
        });

        console.log(`✅ Voiceover regenerated for scene ${sceneId}`);
      } else {
        const errorData = await response.json();
        alert(
          `Failed to generate voiceover: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Failed to generate voiceover:", error);
      alert("Failed to generate voiceover. Please try again.");
    } finally {
      setIsGeneratingVoiceover(null);
    }
  };

  const handleUpdateScene = (sceneId: string, updates: Partial<Scene>) => {
    setScenes((prev) =>
      prev.map((s) => (s.id === sceneId ? { ...s, ...updates } : s))
    );
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      text: "New scene text...",
      duration: 5,
      assets: [],
      mediaUrl: null,
      voiceUrl: null,
      captionsUrl: null,
      sfxUrls: [],
    };
    setScenes((prev) => [...prev, newScene]);
  };

  const handleAddAsset = (type: "image" | "video" | "audio") => {
    if (!selectedSceneId) return;

    // Set default animation based on type
    const defaultAnimation =
      type === "video"
        ? {
            animationType: "fadeIn" as const,
            animationDuration: 0.5,
            animationDelay: 0,
            animationEasing: "easeOut" as const,
          }
        : {
            animationType: "fadeIn" as const,
            animationDuration: 1,
            animationDelay: 0,
            animationEasing: "easeOut" as const,
          };

    const newAsset: SceneAsset = {
      id: `asset_${Date.now()}`,
      type,
      url: "",
      name: `New ${type}`,
      source: "upload",
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: type === "audio" ? 0 : 1, // Audio files hidden by default
      zIndex: 0,
      volume: 1,
      ...defaultAnimation,
    };

    setScenes((prev) =>
      prev.map((s) =>
        s.id === selectedSceneId
          ? { ...s, assets: [...(s.assets || []), newAsset] }
          : s
      )
    );
    setSelectedAssetId(newAsset.id);
  };

  const handleUpdateAsset = (assetId: string, updates: Partial<SceneAsset>) => {
    if (!selectedSceneId) return;

    setScenes((prev) =>
      prev.map((s) =>
        s.id === selectedSceneId
          ? {
              ...s,
              assets: (s.assets || []).map((a) =>
                a.id === assetId ? { ...a, ...updates } : a
              ),
            }
          : s
      )
    );
  };

  const handleDeleteAsset = (assetId: string) => {
    if (!selectedSceneId) return;

    setScenes((prev) =>
      prev.map((s) =>
        s.id === selectedSceneId
          ? {
              ...s,
              assets: (s.assets || []).filter((a) => a.id !== assetId),
            }
          : s
      )
    );

    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
  };

  const handleDeleteScene = async (sceneId: string) => {
    if (!project?.id) {
      alert("Project not loaded");
      return;
    }

    // Optimistically update UI
    setScenes((prev) => prev.filter((s) => s.id !== sceneId));
    
    // If selected scene is deleted, clear selection
    if (selectedSceneId === sceneId) {
      setSelectedSceneId(null);
      setSelectedAssetId(null);
    }

    // Delete from backend
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${project.id}/scenes/${sceneId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete scene");
      }

      console.log(`✅ Scene ${sceneId} deleted successfully`);
    } catch (error) {
      console.error("Failed to delete scene:", error);
      alert(`Failed to delete scene: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      // Reload scenes from backend to restore state
      try {
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
          }/api/v1/projects/${project.id}`
        );
        if (response.ok) {
          const data = await response.json();
          const formattedScenes = (data.scenes || []).map((scene: any) => ({
            id: scene._id?.toString() || scene.id,
            text: scene.text || "",
            duration: scene.duration || 5,
            keywords: scene.keywords || [],
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
            mediaUrl: scene.mediaUrl || null,
            voiceUrl: scene.voiceUrl || null,
            captionsUrl: scene.captionsUrl || null,
            captionStyle: scene.captionStyle || undefined,
            sfxUrls: scene.sfxUrls || [],
            transition: scene.transition || "fade",
          }));
          setScenes(formattedScenes);
        }
      } catch (reloadError) {
        console.error("Failed to reload scenes:", reloadError);
      }
    }
  };

  const handleReorderScenes = (reorderedScenes: Scene[]) => {
    setScenes(reorderedScenes);
    // TODO: Optionally save the new order to the backend
  };

  const handleUpdateProject = async (updates: Partial<Project>) => {
    if (!project) return;

    // Update local state immediately
    setProject((prev) => (prev ? { ...prev, ...updates } : null));

    // Save to backend
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${project.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: updates.title ?? project.title,
            prompt: updates.prompt ?? project.prompt,
          }),
        }
      );

      if (response.ok) {
        console.log("Project updated successfully");
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      // Revert on error
      setProject((prev) => (prev ? { ...prev, title: project.title } : null));
    }
  };

  const handleSave = async () => {
    if (!project) return;

    try {
      // Save project and scenes to backend
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${project.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: project.title,
            scenes: scenes.map((s) => ({
              id: s.id,
              text: s.text,
              duration: s.duration,
              keywords: s.keywords,
              transition: s.transition || "fade",
              assets: (s.assets || []).map((a) => ({
                id: a.id,
                type: a.type,
                url: a.url,
                thumbnailUrl: a.thumbnailUrl,
                name: a.name,
                source: a.source,
                // Transform properties
                x: a.x,
                y: a.y,
                width: a.width,
                height: a.height,
                scale: a.scale,
                rotation: a.rotation,
                opacity: a.opacity,
                zIndex: a.zIndex,
                // Animation properties
                animationType: a.animationType,
                animationDuration: a.animationDuration,
                animationDelay: a.animationDelay,
                animationEasing: a.animationEasing,
                // Audio properties
                startTime: a.startTime,
                volume: a.volume,
              })),
              captionsUrl: s.captionsUrl,
              captionStyle: s.captionStyle,
            })),
          }),
        }
      );

      if (response.ok) {
        console.log("Project saved successfully");
      }
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  };

  const handleExportJson = () => {
    if (!project || scenes.length === 0) {
      alert("No scenes to export. Please create at least one scene.");
      return;
    }

    // Create comprehensive template export
    const templateExport = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      project: {
        id: project.id,
        title: project.title,
        prompt: project.prompt,
        createdAt: project.createdAt,
      },
      scenes: scenes.map((scene) => ({
        id: scene.id,
        text: scene.text,
        duration: scene.duration,
        keywords: scene.keywords || [],
        transition: scene.transition || "fade",
        // All assets with complete properties
        assets: (scene.assets || []).map((asset) => ({
          id: asset.id,
          type: asset.type,
          url: asset.url,
          thumbnailUrl: asset.thumbnailUrl,
          name: asset.name,
          source: asset.source,
          // Transform properties
          x: asset.x,
          y: asset.y,
          width: asset.width,
          height: asset.height,
          scale: asset.scale,
          rotation: asset.rotation,
          opacity: asset.opacity,
          zIndex: asset.zIndex,
          // Animation properties
          animationType: asset.animationType,
          animationDuration: asset.animationDuration,
          animationDelay: asset.animationDelay,
          animationEasing: asset.animationEasing,
          // Audio properties (if applicable)
          startTime: asset.startTime,
          volume: asset.volume,
        })),
        // Caption information
        captionsUrl: scene.captionsUrl,
        captionStyle: scene.captionStyle,
        // Legacy fields for backward compatibility
        mediaUrl: scene.mediaUrl,
        voiceUrl: scene.voiceUrl,
        sfxUrls: scene.sfxUrls,
      })),
    };

    // Convert to JSON string with pretty formatting
    const jsonString = JSON.stringify(templateExport, null, 2);

    // Create a blob and download
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title.replace(
      /[^a-z0-9]/gi,
      "_"
    )}_template_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Template exported successfully");
  };

  const handleImportJson = () => {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        // Read the file
        const text = await file.text();
        const templateData = JSON.parse(text);

        // Validate the template structure
        if (!templateData.scenes || !Array.isArray(templateData.scenes)) {
          alert("Invalid template file: Missing or invalid scenes array");
          return;
        }

        // Import project info if available
        if (templateData.project && project) {
          // Optionally update project title if user wants
          // For now, we'll just import the scenes
        }

        // Reconstruct scenes with all properties
        const importedScenes: Scene[] = templateData.scenes.map(
          (sceneData: any) => ({
            id:
              sceneData.id ||
              `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: sceneData.text || "",
            duration: sceneData.duration || 5,
            keywords: sceneData.keywords || [],
            transition: sceneData.transition || "fade",

            // Import all assets with complete properties
            assets: (sceneData.assets || []).map((assetData: any) => ({
              id:
                assetData.id ||
                `asset_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              type: assetData.type || "image",
              url: assetData.url || "",
              thumbnailUrl: assetData.thumbnailUrl,
              name: assetData.name || "Imported Asset",
              source: assetData.source || "upload",

              // Transform properties
              x: assetData.x ?? 0,
              y: assetData.y ?? 0,
              width: assetData.width ?? 100,
              height: assetData.height ?? 100,
              scale: assetData.scale ?? 1,
              rotation: assetData.rotation ?? 0,
              opacity: assetData.opacity ?? 1,
              zIndex: assetData.zIndex ?? 0,

              // Animation properties
              animationType: assetData.animationType || "fadeIn",
              animationDuration: assetData.animationDuration ?? 1,
              animationDelay: assetData.animationDelay ?? 0,
              animationEasing: assetData.animationEasing || "easeOut",

              // Audio properties (if applicable)
              startTime: assetData.startTime,
              volume: assetData.volume,
            })),

            // Caption information
            captionsUrl: sceneData.captionsUrl || null,
            captionStyle: sceneData.captionStyle || undefined,

            // Legacy fields (for backward compatibility)
            mediaUrl: sceneData.mediaUrl || null,
            voiceUrl: sceneData.voiceUrl || null,
            sfxUrls: sceneData.sfxUrls || [],
          })
        );

        // Replace current scenes with imported scenes
        setScenes(importedScenes);

        // Select the first scene if available
        if (importedScenes.length > 0) {
          setSelectedSceneId(importedScenes[0].id);
        }

        // Show success message
        alert(
          `✅ Successfully imported ${importedScenes.length} scene(s) from template!`
        );

        console.log("✅ Template imported successfully:", {
          scenesCount: importedScenes.length,
          totalAssets: importedScenes.reduce(
            (sum, s) => sum + (s.assets?.length || 0),
            0
          ),
        });
      } catch (error) {
        console.error("Failed to import template:", error);
        alert(
          `Failed to import template: ${
            error instanceof Error ? error.message : "Invalid JSON file"
          }`
        );
      }
    };

    // Trigger file selection
    input.click();
  };

  const [renderJobId, setRenderJobId] = useState<string | null>(null);
  const [renderStatus, setRenderStatus] = useState<{
    status: string;
    progress: number;
    resultUrl?: string;
  } | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const handleRender = async () => {
    if (!project) return;

    setIsRendering(true);
    setRenderStatus(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/render`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            resolution: "1920x1080",
            fps: 30,
            format: "mp4",
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRenderJobId(data.jobId);

        // Poll for status
        const pollStatus = async () => {
          try {
            const statusResponse = await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
              }/api/v1/render/${data.jobId}/status`
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              // Round progress to 2 digits (or integer)
              const roundedProgress = statusData.progress
                ? Math.round(statusData.progress)
                : 0;
              setRenderStatus({
                ...statusData,
                progress: roundedProgress,
              });

              if (statusData.status === "completed" && statusData.resultUrl) {
                setIsRendering(false);
                // Don't auto-download - let user click download button
                // Download button will appear in Topbar
              } else if (statusData.status === "failed") {
                setIsRendering(false);
                alert(`Render failed: ${statusData.error || "Unknown error"}`);
              } else if (
                statusData.status === "processing" ||
                statusData.status === "queued"
              ) {
                // Continue polling
                setTimeout(pollStatus, 2000);
              }
            }
          } catch (error) {
            console.error("Failed to poll render status:", error);
            setIsRendering(false);
          }
        };

        // Start polling after 2 seconds
        setTimeout(pollStatus, 2000);
      } else {
        const errorData = await response.json();
        alert(`Failed to start render: ${errorData.error || "Unknown error"}`);
        setIsRendering(false);
      }
    } catch (error) {
      console.error("Failed to start render:", error);
      alert("Failed to start render. Please try again.");
      setIsRendering(false);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Topbar
        project={project}
        onRender={handleRender}
        onSave={handleSave}
        onUpdateProject={handleUpdateProject}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        isRendering={isRendering}
        renderProgress={renderStatus?.progress || 0}
        renderStatus={renderStatus}
        onDownloadVideo={() => {
          if (renderStatus?.resultUrl && renderJobId) {
            const downloadUrl = `${
              process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
            }/api/v1/render/download/${renderJobId}`;
            window.open(downloadUrl, "_blank");
          } else if (renderStatus?.resultUrl) {
            // Fallback: try to extract jobId from resultUrl
            const jobIdMatch = renderStatus.resultUrl.match(/render_([^.]+)\.mp4/);
            if (jobIdMatch) {
              const jobId = jobIdMatch[1];
              const downloadUrl = `${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
              }/api/v1/render/download/${jobId}`;
              window.open(downloadUrl, "_blank");
            } else {
              // Last fallback: direct URL
              const downloadUrl = `${
                process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
              }${renderStatus.resultUrl}`;
              window.open(downloadUrl, "_blank");
            }
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Scenes Panel */}
        <ResizableSidebar
          defaultWidth={320}
          minWidth={200}
          maxWidth={600}
          side="left"
        >
          <div className="h-full overflow-y-auto">
            <ScenesPanel
              scenes={scenes}
              selectedSceneId={selectedSceneId}
              onSelectScene={(id) => {
                setSelectedSceneId(id);
                setSelectedAssetId(null); // Clear asset selection when scene changes
                setIsCaptionSelected(false); // Clear caption selection when scene changes
              }}
              onUpdateScene={handleUpdateScene}
              onAddScene={handleAddScene}
              onDeleteScene={handleDeleteScene}
              onReorderScenes={handleReorderScenes}
              onGenerateScript={handleOpenModal}
              onUpdateSceneScript={handleUpdateSceneScript}
              onRegenerateVoiceover={handleRegenerateVoiceover}
              isGenerating={false}
              isGeneratingVoiceover={isGeneratingVoiceover}
            />
          </div>
        </ResizableSidebar>

        {/* Center: Canvas Preview */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
          <CanvasPreview
            scenes={scenes}
            selectedSceneId={selectedSceneId}
            selectedAssetId={selectedAssetId}
            onSelectAsset={(assetId) => {
              setSelectedAssetId(assetId);
              setIsCaptionSelected(false); // Clear caption selection when asset is selected
            }}
            onSelectCaption={(selected) => {
              setIsCaptionSelected(selected);
              if (selected) {
                setSelectedAssetId(null); // Clear asset selection when caption is selected
              }
            }}
          />
        </div>

        {/* Right: Layers & Assets Panel or Common Panel */}
        <ResizableSidebar
          defaultWidth={320}
          minWidth={200}
          maxWidth={800}
          side="right"
        >
          {showCommonPanel ? (
            <CommonPanel
              onAddText={() => {
                handleAddAsset("image"); // Placeholder - could add text asset type
                setShowCommonPanel(false);
              }}
              onAddMedia={() => {
                handleAddAsset("image");
                setShowCommonPanel(false);
              }}
              onAddWatermark={() => {
                // TODO: Add watermark functionality
                setShowCommonPanel(false);
              }}
              onAddShape={() => {
                // TODO: Add shape functionality
                setShowCommonPanel(false);
              }}
              onAddBackgroundAudio={() => {
                handleAddAsset("audio");
                setShowCommonPanel(false);
              }}
              onAddEffects={() => {
                // TODO: Add effects functionality
                setShowCommonPanel(false);
              }}
              onClose={() => setShowCommonPanel(false)}
              selectedSceneId={selectedSceneId}
              scenes={scenes}
              onUpdateScene={handleUpdateScene}
              onAddAsset={handleAddAsset}
              projectId={project?.id}
            />
          ) : (
            <ResizableSplitPanel
              sections={[
                {
                  id: "layers",
                  content: (
                    <div className="h-full overflow-hidden flex flex-col">
                      <LayersPanel
                        selectedScene={
                          scenes.find((s) => s.id === selectedSceneId) || null
                        }
                        onUpdateAsset={handleUpdateAsset}
                        onDeleteAsset={handleDeleteAsset}
                        onAddAsset={handleAddAsset}
                        onSelectAsset={setSelectedAssetId}
                        selectedAssetId={selectedAssetId}
                        projectId={project?.id}
                        onUpdateScene={handleUpdateScene}
                      />
                    </div>
                  ),
                  defaultHeight: 300,
                  minHeight: 150,
                  maxHeight: 600,
                },
                ...(selectedAssetId && selectedSceneId
                  ? (() => {
                      const selectedAsset = scenes
                        .find((s) => s.id === selectedSceneId)
                        ?.assets?.find((a) => a.id === selectedAssetId);

                      return selectedAsset
                        ? [
                            {
                              id: "transform",
                              content: (
                                <TransformControls
                                  asset={selectedAsset}
                                  onUpdate={(updates) =>
                                    handleUpdateAsset(selectedAssetId, updates)
                                  }
                                  onClose={() => setSelectedAssetId(null)}
                                />
                              ),
                              defaultHeight: 400,
                              minHeight: 200,
                              maxHeight: 600,
                            },
                          ]
                        : [];
                    })()
                  : selectedSceneId && isCaptionSelected && !selectedAssetId
                  ? [
                      {
                        id: "caption-transform",
                        content: (
                          <CaptionTransformControls
                            captionStyle={
                              scenes.find((s) => s.id === selectedSceneId)
                                ?.captionStyle || {}
                            }
                            onUpdate={(updates) => {
                              handleUpdateScene(selectedSceneId, {
                                captionStyle: {
                                  ...(scenes.find(
                                    (s) => s.id === selectedSceneId
                                  )?.captionStyle || {}),
                                  ...updates,
                                },
                              });
                            }}
                            onClose={() => setIsCaptionSelected(false)}
                          />
                        ),
                        defaultHeight: 350,
                        minHeight: 200,
                        maxHeight: 600,
                      },
                    ]
                  : []),
                {
                  id: "common-button",
                  content: (
                    <div className="border-t border-gray-700 p-4 flex-shrink-0">
                      <button
                        onClick={() => setShowCommonPanel(true)}
                        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        Show Common Elements
                      </button>
                    </div>
                  ),
                  defaultHeight: 60,
                  minHeight: 60,
                  maxHeight: 60,
                },
              ]}
            />
          )}
        </ResizableSidebar>
      </div>

      {/* Generate Script Modal */}
      <GenerateScriptModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onScriptGenerated={handleScriptGenerated}
        projectId={project?.id}
        currentPrompt={project?.prompt || ""}
      />
    </div>
  );
}
