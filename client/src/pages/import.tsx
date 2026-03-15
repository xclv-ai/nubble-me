import { useState, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Upload, FileText, BookOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type UploadStage = "idle" | "uploading" | "processing" | "done" | "error";

interface UploadResult {
  id: string;
  title: string;
  author: string;
  sectionCount: number;
  wordCount: number;
  nlmEnhanced: boolean;
}

export default function ImportPage() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "epub", "txt"].includes(ext || "")) {
      setError("Unsupported file type. Please upload a PDF, ePub, or TXT file.");
      setStage("error");
      return;
    }

    setStage("uploading");
    setProgress(`Uploading ${file.name}...`);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStage("processing");
      setProgress("Extracting text and generating depths...");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Upload failed");
      }

      const data: UploadResult = await response.json();
      setResult(data);
      setStage("done");
      setProgress("");
    } catch (err: any) {
      setError(err.message);
      setStage("error");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openReader = useCallback(() => {
    if (result) {
      setLocation(`/read/${result.id}`);
    }
  }, [result, setLocation]);

  const reset = useCallback(() => {
    setStage("idle");
    setResult(null);
    setError("");
    setProgress("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">
            Import Document
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Upload a PDF, ePub, or text file to create a multi-depth reading experience
          </p>
        </div>

        {/* Upload area */}
        {stage === "idle" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-200
              ${isDragOver
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
              }
            `}
          >
            <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drop file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, ePub, or TXT — up to 100MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.epub,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* Processing state */}
        {(stage === "uploading" || stage === "processing") && (
          <div className="border rounded-xl p-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-sm font-medium text-foreground mb-1">{progress}</p>
            <p className="text-xs text-muted-foreground">
              This may take a moment for large documents
            </p>
          </div>
        )}

        {/* Success state */}
        {stage === "done" && result && (
          <div className="border rounded-xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground mb-1">{result.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{result.author}</p>

            <div className="flex justify-center gap-6 mb-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                {result.sectionCount} sections
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {result.wordCount.toLocaleString()} words
              </div>
            </div>

            {result.nlmEnhanced && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-4">
                Enhanced with NotebookLM
              </p>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={openReader}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Start Reading
              </button>
              <button
                onClick={reset}
                className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Import Another
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {stage === "error" && (
          <div className="border border-destructive/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-4 text-destructive" />
            <p className="text-sm font-medium text-foreground mb-1">Import Failed</p>
            <p className="text-xs text-destructive mb-4">{error}</p>
            <button
              onClick={reset}
              className="px-6 py-2.5 border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => setLocation("/")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to sample article
          </button>
        </div>
      </div>
    </div>
  );
}
