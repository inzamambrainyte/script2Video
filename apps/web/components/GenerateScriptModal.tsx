"use client";

import { useState } from "react";
import { Scene } from "@/types";

interface GenerateScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScriptGenerated: (scenes: Scene[]) => void;
  projectId?: string;
  currentPrompt?: string;
}

export default function GenerateScriptModal({
  isOpen,
  onClose,
  onScriptGenerated,
  projectId = "proj_1",
  currentPrompt = "",
}: GenerateScriptModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [prompt, setPrompt] = useState(currentPrompt);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [targetLength, setTargetLength] = useState(60);
  const [tone, setTone] = useState("informal");
  const [voiceoverProvider, setVoiceoverProvider] = useState<
    "openai" | "elevenlabs"
  >("elevenlabs");
  const [openaiVoice, setOpenaiVoice] = useState("alloy");
  const [elevenlabsVoice, setElevenlabsVoice] = useState("eleven_en_us_v1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a script prompt");
      return;
    }

    if (!projectId) {
      setError("Project ID is missing. Please refresh the page.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        }/api/v1/projects/${projectId}/generate-script`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            aspectRatio,
            targetLengthSeconds: targetLength,
            tone,
            voiceoverProvider,
            voiceoverVoiceId:
              voiceoverProvider === "openai" ? openaiVoice : elevenlabsVoice,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate script");
      }

      const data = await response.json();
      setGeneratedScenes(data.scenes || []);
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate script"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    onScriptGenerated(generatedScenes);
    handleClose();
  };

  const handleClose = () => {
    setStep(1);
    setPrompt(currentPrompt);
    setAspectRatio("16:9");
    setTargetLength(60);
    setTone("informal");
    setVoiceoverProvider("elevenlabs");
    setOpenaiVoice("alloy");
    setElevenlabsVoice("eleven_en_us_v1");
    setGeneratedScenes([]);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {step === 1 ? "Generate Script" : "Generated Script"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Script Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Script Prompt *
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to create... (e.g., 'A 60-second explainer video about artificial intelligence')"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={4}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Provide a detailed description of your video content
                </p>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["16:9", "9:16", "1:1"].map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      className={`px-4 py-3 rounded-lg border transition-colors ${
                        aspectRatio === ratio
                          ? "bg-primary-600 border-primary-500 text-white"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Length */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Length: {targetLength} seconds
                </label>
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="5"
                  value={targetLength}
                  onChange={(e) => setTargetLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>15s</span>
                  <span>300s</span>
                </div>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tone
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="informal">Informal</option>
                  <option value="formal">Formal</option>
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              {/* Voiceover Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Voiceover Provider
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    onClick={() => setVoiceoverProvider("openai")}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      voiceoverProvider === "openai"
                        ? "bg-primary-600 border-primary-500 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    OpenAI TTS
                  </button>
                  <button
                    onClick={() => setVoiceoverProvider("elevenlabs")}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      voiceoverProvider === "elevenlabs"
                        ? "bg-primary-600 border-primary-500 text-white"
                        : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    ElevenLabs
                  </button>
                </div>

                {/* OpenAI Voice Selection */}
                {voiceoverProvider === "openai" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      OpenAI Voice
                    </label>
                    <select
                      value={openaiVoice}
                      onChange={(e) => setOpenaiVoice(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="alloy">Alloy</option>
                      <option value="echo">Echo</option>
                      <option value="fable">Fable</option>
                      <option value="onyx">Onyx</option>
                      <option value="nova">Nova</option>
                      <option value="shimmer">Shimmer</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Uses OpenAI TTS API (tts-1 model)
                    </p>
                  </div>
                )}

                {/* ElevenLabs Voice Selection */}
                {voiceoverProvider === "elevenlabs" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-400 mb-2">
                      ElevenLabs Voice ID
                    </label>
                    <input
                      type="text"
                      value={elevenlabsVoice}
                      onChange={(e) => setElevenlabsVoice(e.target.value)}
                      placeholder="eleven_en_us_v1"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder-gray-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Enter ElevenLabs voice ID (e.g., eleven_en_us_v1)
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">
                    Generated Scenes
                  </h3>
                  <span className="text-xs text-gray-400">
                    {generatedScenes.length} scenes •{" "}
                    {generatedScenes.reduce((sum, s) => sum + s.duration, 0)}s
                    total
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedScenes.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">
                    No scenes generated
                  </p>
                ) : (
                  generatedScenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-primary-400">
                          Scene {index + 1}
                        </span>
                        <span className="text-xs text-gray-400">
                          {scene.duration}s
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{scene.text}</p>
                      {scene.keywords && scene.keywords.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Keywords: {scene.keywords.join(', ')}
                        </p>
                      )}
                      {scene.assets && scene.assets.length > 0 && (
                        <div className="mt-2 flex gap-2">
                          {scene.assets.map((asset) => (
                            asset.type !== 'audio' && asset.thumbnailUrl && (
                              <img
                                key={asset.id}
                                src={asset.thumbnailUrl}
                                alt={asset.name}
                                className="max-h-24 object-cover rounded"
                              />
                            )
                          ))}
                        </div>
                      )}
                      {scene.mediaUrl && !scene.assets?.length && (
                        <img src={scene.mediaUrl} alt="Scene media" className="mt-2 max-h-24 object-cover rounded" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-end gap-3">
          {step === 1 ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? "Generating..." : "Generate Script"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={generatedScenes.length === 0}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply Script
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
