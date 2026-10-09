import { useState, useRef } from "react";
import { X, RefreshCw } from "lucide-react";

type FileRecord = {
  id: string;
  title: string;
  slug: string;
};

type UpdateFileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerSlug: string;
  fileRecord: FileRecord | null;
};

export default function UpdateFileModal({
  isOpen,
  onClose,
  onSuccess,
  customerSlug,
  fileRecord,
}: UpdateFileModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !fileRecord) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select an HTML file to update.");
      return;
    }

    if (!file.name.endsWith(".html")) {
      setError("Only HTML files are allowed.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("fileId", fileRecord.id);
      formData.append("slug", fileRecord.slug);
      formData.append("file", file);

      const res = await fetch(`/api/workspace/${customerSlug}/files`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update file.");
      }

      onSuccess();
      onClose();
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

        <h2 className="text-xl font-semibold text-foreground mb-6 font-sans">Update HTML Document</h2>

        <div className="mb-4 p-3 rounded bg-surface-hover border border-border-color">
          <p className="text-meta font-medium text-foreground truncate" title={fileRecord.title}>
            Document: {fileRecord.title}
          </p>
          <p className="text-meta text-foreground-muted truncate">
            URL Path: /s/{customerSlug}/{fileRecord.slug}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
          <div>
            <label htmlFor="update-file" className="block text-meta font-medium text-foreground mb-1">
              Select New HTML File
            </label>
            <input
              type="file"
              id="update-file"
              accept=".html"
              ref={fileInputRef}
              disabled={loading}
              onChange={handleFileChange}
              className="block w-full text-meta text-zinc-500 dark:text-foreground-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-meta file:font-semibold file:bg-surface-hover file:text-zinc-700 file:cursor-pointer hover:file:bg-zinc-200 transition-colors duration-200"
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 text-meta text-red-600 font-medium border border-red-100">
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
              className="px-4 py-2 border border-transparent rounded-md text-meta font-medium text-white bg-primary hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <span>Updating...</span>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Update File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
