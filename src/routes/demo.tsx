import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Logo } from "@/components/Logo";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Upload, Copy, Check, AlertTriangle, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/demo")({ component: DemoPage });

function DemoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ url: string; expiresAt: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer logic
  useEffect(() => {
    if (!result) return;
    const expiresTime = new Date(result.expiresAt).getTime();

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expiresTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".html") && !selectedFile.name.endsWith(".htm")) {
        setError("Only .html and .htm files are allowed.");
        setFile(null);
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".html") && !selectedFile.name.endsWith(".htm")) {
        setError("Only .html and .htm files are allowed.");
        setFile(null);
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/demo/files", {
        method: "POST",
        body: formData,
      });

      if (res.status === 404) {
        throw new Error("Demo uploads are currently disabled.");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file.");
      }

      setResult({
        url: data.url,
        expiresAt: data.expiresAt,
      });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-canvas text-foreground font-sans">
      <Navbar />

      {/* Standalone clean header for anonymous users */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Logo className="transform scale-75 origin-left" />
        </a>
        <a href="/" className="inline-flex items-center gap-1.5 text-meta text-foreground-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </a>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12 flex flex-col justify-center">
        {!result ? (
          <div className="space-y-8">
            <div className="space-y-3 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Try Serve-it Demo</h1>
              <p className="text-foreground-muted">
                Experience instant, unmodified HTML serving. Upload an HTML file, get a working URL, and share it with anyone. No account required.
              </p>
            </div>

            <Card className="p-6 border border-border-color bg-surface shadow-sm rounded-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border-color hover:border-primary/50 rounded-sm p-8 text-center cursor-pointer transition-colors duration-200 group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".html,.htm"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 bg-canvas rounded-full border border-border-color flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 text-foreground-muted group-hover:text-primary transition-colors" />
                    </div>
                    {file ? (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground text-meta truncate max-w-md">{file.name}</p>
                        <p className="text-xs text-foreground-muted">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground text-meta">Click or drag HTML file to upload</p>
                        <p className="text-xs text-foreground-muted">Accepts .html and .htm up to 2 MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-meta rounded-sm border border-red-100 dark:border-red-900/30 font-medium">
                    {error}
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading || !file}
                    className="w-full sm:w-auto px-6 py-3 font-medium flex items-center justify-center gap-2"
                  >
                    {loading ? "Generating Link..." : "Generate Demo Link"}
                  </Button>
                </div>
              </form>
            </Card>

            <div className="text-center">
              <p className="text-xs text-foreground-muted font-sans leading-relaxed">
                By uploading, you agree that your temporary artifact will be automatically hard-deleted after 1 hour.<br />
                Demo endpoints enforce global capacity and rate limiting to prevent abuse.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-3 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Demo Link Generated!</h1>
              <p className="text-foreground-muted">
                Your HTML document is now live on our high-performance infrastructure layer.
              </p>
            </div>

            <Card className="p-6 border border-border-color bg-surface shadow-sm rounded-sm space-y-6">
              <div className="space-y-2">
                <label className="block text-meta font-bold text-foreground">Live Public URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.url}
                    className="flex-1 border border-border-color rounded-sm py-2 px-3 text-meta bg-canvas text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-primary text-white hover:bg-green-700 rounded-sm font-medium transition-colors flex items-center justify-center min-w-[100px]"
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Copied</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-color">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-meta font-bold text-foreground mt-0.5">⏱️</div>
                  <div>
                    <h4 className="font-semibold text-meta text-foreground mb-0.5">Expires In</h4>
                    <p className="text-foreground-muted text-meta text-primary font-bold">{formatTime(timeRemaining)}</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-meta text-foreground mb-0.5">One-Time View</h4>
                    <p className="text-foreground-muted text-xs">
                      This page will not show this URL again. Copy and save it now if you need to revisit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-color flex justify-between items-center flex-wrap gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="text-meta text-primary hover:underline font-semibold"
                >
                  Upload another file
                </button>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-sm text-meta font-medium text-white bg-primary hover:bg-green-700 transition-colors"
                >
                  Visit Live Link
                </a>
              </div>
            </Card>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-border-color rounded-sm text-center">
              <p className="text-meta text-foreground-muted">
                Want persistent deployments, customizable domains, and analytics?
              </p>
              <a href="/auth/signin" className="mt-2 inline-block text-meta text-primary font-bold hover:underline">
                Create a Free Workspace →
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-6 border-t border-border-color bg-surface mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-meta text-foreground-muted">
            Serve-It Infrastructure © {new Date().getFullYear()} — Anonymous 1-Hour Public Artifacts
          </p>
        </div>
      </footer>
    </div>
  );
}
