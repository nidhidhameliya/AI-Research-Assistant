"use client";

import { useCallback, useState } from "react";
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { UploadResponse } from "@/lib/api";

interface FileItem {
  id: string;
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  result?: UploadResponse;
  error?: string;
}

const ACCEPTED_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/json": ".json",
  "text/csv": ".csv",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

export function FileDropzone() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files);
      addFiles(dropped);
    },
    [addFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    e.target.value = "";
  };

  const uploadFile = async (item: FileItem) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading" } : f))
    );
    try {
      const result = await api.uploadFile(item.file);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "success", result } : f
        )
      );
    } catch (err: unknown) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
            : f
        )
      );
    }
  };

  const uploadAll = async () => {
    const pending = files.filter((f) => f.status === "pending" || f.status === "error");
    for (const item of pending) {
      await uploadFile(item);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200",
          isDragging
            ? "border-blue-500/60 bg-blue-500/5 scale-[1.01]"
            : "border-[hsl(222,47%,22%)] hover:border-blue-500/30 hover:bg-blue-500/3"
        )}
      >
        <input
          type="file"
          multiple
          accept={Object.keys(ACCEPTED_TYPES).join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3 pointer-events-none">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200",
            isDragging
              ? "bg-blue-500/20 border border-blue-500/30"
              : "bg-[hsl(222,47%,14%)] border border-[hsl(222,47%,22%)]"
          )}>
            <Upload className={cn("w-6 h-6", isDragging ? "text-blue-400" : "text-[hsl(215,20%,50%)]")} />
          </div>
          <div>
            <p className="text-white font-medium">
              {isDragging ? "Drop files here" : "Drag & drop files"}
            </p>
            <p className="text-[hsl(215,20%,50%)] text-sm mt-1">
              or <span className="text-blue-400">click to browse</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {["PDF", "DOCX", "TXT", "MD", "JSON", "CSV", "PNG", "JPG"].map((ext) => (
              <span
                key={ext}
                className="text-[10px] px-2 py-0.5 rounded-md bg-[hsl(222,47%,14%)] text-[hsl(215,20%,50%)] border border-[hsl(222,47%,20%)]"
              >
                {ext}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">{files.length} file(s)</p>
            {pendingCount > 0 && (
              <button
                onClick={uploadAll}
                className="px-4 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
              >
                Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {files.map((item) => (
            <FileRow key={item.id} item={item} onRemove={removeFile} onUpload={uploadFile} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileRow({
  item,
  onRemove,
  onUpload,
}: {
  item: FileItem;
  onRemove: (id: string) => void;
  onUpload: (item: FileItem) => void;
}) {
  const ext = item.file.name.split(".").pop()?.toUpperCase() || "FILE";
  const isImage = ["PNG", "JPG", "JPEG"].includes(ext);
  const Icon = isImage ? Image : FileText;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass border border-[hsl(222,47%,18%)] animate-fade-in">
      <div className="w-8 h-8 rounded-lg bg-[hsl(222,47%,14%)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[hsl(215,20%,55%)]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{item.file.name}</p>
        <p className="text-[10px] text-[hsl(215,20%,45%)]">
          {(item.file.size / 1024).toFixed(1)} KB
          {item.result && ` · ${item.result.chunks_created} chunks indexed`}
          {item.error && ` · ${item.error}`}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {item.status === "pending" && (
          <button
            onClick={() => onUpload(item)}
            className="text-xs px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
          >
            Upload
          </button>
        )}
        {item.status === "uploading" && (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        )}
        {item.status === "success" && (
          <CheckCircle className="w-4 h-4 text-green-400" />
        )}
        {item.status === "error" && (
          <AlertCircle className="w-4 h-4 text-red-400" />
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="w-6 h-6 rounded-lg hover:bg-white/5 flex items-center justify-center text-[hsl(215,20%,45%)] hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
