"use client";

import { useState, useRef } from "react";
import { X, Upload } from "lucide-react";
import { getCsrfToken } from "@/lib/csrf-client";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerSlug: string;
};

export default function UploadModal({ isOpen, onClose, onSuccess, customerSlug }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      if (!title) setTitle(baseName);
      if (!slug) setSlug(baseName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (!file.name.endsWith(".html")) {
      setError("Only HTML files are allowed.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("slug", slug);
      formData.append("file", file);
      if (tags) {
        formData.append("tags", tags);
      }

      const res = await fetch(`/api/workspace/${customerSlug}/files`, {
        method: "POST",
        body: formData,
        headers: { "x-csrf-token": getCsrfToken() },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file.");
      }

      onSuccess();
      onClose();
      setTitle("");
      setSlug("");
      setTags("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-lg border border-border-color bg-surface p-6 shadow-xl animate-in fade-in-50 zoom-in-95 duration-150 text-foreground transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          type="button"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold text-foreground mb-6 font-sans">Upload HTML Document</h2>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label htmlFor="title" className="block text-meta font-medium text-foreground mb-1">
              Document Title
            </label>
            <input
              type="text"
              id="title"
              required
              disabled={loading}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full border border-border-color rounded-md py-2 px-3 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900   bg-surface text-foreground transition-colors duration-200"
              placeholder="e.g. Project Specs"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-meta font-medium text-foreground mb-1">
              URL Slug
            </label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border-color  bg-surface-hover text-zinc-500 dark:text-foreground-muted text-meta select-none transition-colors duration-200">
                /s/{customerSlug}/
              </span>
              <input
                type="text"
                id="slug"
                required
                disabled={loading}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 block w-full border border-border-color rounded-r-md py-2 px-3 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900   bg-surface text-foreground transition-colors duration-200"
                placeholder="project-specs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-meta font-medium text-foreground mb-1">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              disabled={loading}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="block w-full border border-border-color rounded-md py-2 px-3 text-meta focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900   bg-surface text-foreground transition-colors duration-200"
              placeholder="comma-separated, e.g. spec, v1, draft"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-meta font-medium text-foreground mb-1">
              Select HTML File
            </label>
            <input
              type="file"
              id="file"
              accept=".html"
              ref={fileInputRef}
              disabled={loading}
              onChange={handleFileChange}
              className="block w-full text-meta text-zinc-500 dark:text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-meta file:font-semibold file:bg-surface-hover  file:text-zinc-700  file:cursor-pointer hover:file:bg-zinc-200  transition-colors duration-200"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50  text-meta text-red-600  font-medium border border-red-100 ">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border-color rounded-md text-meta font-medium text-foreground hover:bg-surface-hover transition-colors"
              type="button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md text-meta font-medium text-white  bg-primary hover:bg-green-700 disabled:opacity-50  transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span>Uploading...</span>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
