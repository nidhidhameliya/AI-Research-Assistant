"use client";

import { FileDropzone } from "@/components/upload/FileDropzone";
import { Upload, Info } from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function UploadPage() {
  return (
    <RequireAuth>
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[hsl(222,47%,18%)] px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h1 className="font-semibold text-white">Upload Documents</h1>
              <p className="text-[hsl(215,20%,50%)] text-xs mt-0.5">
                Index files into your knowledge base
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-3xl p-6">
          {/* Info box */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-500/15 bg-blue-500/5 px-4 py-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
            <div className="text-xs leading-relaxed text-[hsl(215,20%,60%)]">
              <p className="mb-0.5 font-medium text-blue-300">How it works</p>
              <p>
                Files are extracted, chunked, and embedded using a local all-MiniLM-L6-v2 model.
                Vectors are stored in ChromaDB. Architecture diagrams are analyzed by Groq Vision (LLaMA 4 Scout).
              </p>
            </div>
          </div>

          {/* Dropzone */}
          <FileDropzone />

          {/* Supported formats */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(215,20%,45%)]">
              Supported Formats
            </p>
            <div className="grid grid-cols-2 gap-3">
              {FORMAT_INFO.map((f) => (
                <div
                  key={f.ext}
                  className="flex items-start gap-3 rounded-xl border border-[hsl(222,47%,18%)] px-3 py-2.5 glass"
                >
                  <span className="flex-shrink-0 rounded bg-[hsl(222,47%,14%)] px-1.5 py-0.5 text-[10px] font-bold text-[hsl(215,20%,60%)] mt-0.5">
                    {f.ext}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-white">{f.name}</p>
                    <p className="text-[10px] text-[hsl(215,20%,45%)]">{f.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}

const FORMAT_INFO = [
  { ext: "PDF", name: "PDF Documents", note: "Extracted page-by-page with PyPDF" },
  { ext: "DOCX", name: "Word Documents", note: "Paragraphs and tables extracted" },
  { ext: "MD", name: "Markdown", note: "Header-aware chunking" },
  { ext: "TXT", name: "Plain Text", note: "Raw text chunking" },
  { ext: "JSON", name: "JSON Files", note: "Pretty-printed and chunked" },
  { ext: "CSV", name: "CSV Files", note: "Row-by-row text extraction" },
  { ext: "PNG/JPG", name: "Architecture Diagrams", note: "Groq LLaMA 4 Scout Vision analysis" },
];
