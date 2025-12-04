"use client";

import { useState, useRef, useEffect } from "react";
import { Project } from "@/types";

interface TopbarProps {
  project: Project;
  onRender: () => void;
  onSave: () => void;
  onUpdateProject?: (updates: Partial<Project>) => void;
  onExportJson?: () => void;
  onImportJson?: () => void;
  isRendering?: boolean;
  renderProgress?: number;
  renderStatus?: {
    status: string;
    progress: number;
    resultUrl?: string;
  } | null;
  onDownloadVideo?: () => void;
}

export default function Topbar({
  project,
  onRender,
  onSave,
  onUpdateProject,
  onExportJson,
  onImportJson,
  isRendering = false,
  renderProgress = 0,
  renderStatus = null,
  onDownloadVideo,
}: TopbarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(project.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Update editing title when project changes
  useEffect(() => {
    setEditingTitle(project.title);
  }, [project.title]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    if (onUpdateProject && editingTitle.trim() && editingTitle.trim() !== project.title) {
      onUpdateProject({ title: editingTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEditingTitle(project.title);
      setIsEditingTitle(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
      // Close title editing if clicking outside
      if (isEditingTitle && titleInputRef.current && !titleInputRef.current.contains(event.target as Node)) {
        handleSaveTitle();
      }
    };

    if (showMoreMenu || isEditingTitle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu, isEditingTitle, editingTitle, project.title, onUpdateProject]);

  return (
    <>
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">Remotion</h1>
        </div>

        {/* Right: Icons and Actions */}
        <div className="flex items-center gap-4">
          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-4">
            {/* Save Button */}
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              title="Save project changes"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Save
            </button>

            <button
              onClick={onRender}
              disabled={isRendering}
              className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {isRendering ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Rendering{" "}
                  {renderProgress > 0 ? `${Math.round(renderProgress)}%` : ""}
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export Video
                </>
              )}
            </button>

            {/* Download Video Button - Shows when render is completed */}
            {renderStatus?.status === "completed" &&
              renderStatus?.resultUrl && (
                <button
                  onClick={() => {
                    if (onDownloadVideo) {
                      onDownloadVideo();
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Video
                </button>
              )}

            <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      if (onImportJson) {
                        onImportJson();
                      }
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3 border-b border-gray-700"
                  >
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <div>
                      <div className="font-medium">Import Template JSON</div>
                      <div className="text-xs text-gray-400">
                        Load scenes from JSON file
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (onExportJson) {
                        onExportJson();
                      }
                      setShowMoreMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                  >
                    <svg
                      className="w-5 h-5 text-pink-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <div className="font-medium">Export Template JSON</div>
                      <div className="text-xs text-gray-400">
                        Download all scenes as JSON
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Trail */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-6 text-sm text-gray-400">
        <span className="hover:text-white cursor-pointer">Files</span>
        <span className="mx-2">/</span>
        <span className="hover:text-white cursor-pointer">Templates</span>
        <span className="mx-2">/</span>
        <span className="hover:text-white cursor-pointer">Training</span>
        <span className="mx-2">/</span>
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleSaveTitle}
            className="bg-gray-700 border border-pink-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="text-white hover:text-pink-400 cursor-pointer transition-colors flex items-center gap-1 group"
            onClick={() => setIsEditingTitle(true)}
            title="Click to edit project name"
          >
            {project.title}
            <svg
              className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </span>
        )}
      </div>
    </>
  );
}
