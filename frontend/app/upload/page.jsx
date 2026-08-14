"use client";

import { FileDropzone } from "../../components/upload/FileDropzone";

export default function UploadPage() {
  return (
    <div className="flex flex-col h-full overflow-y-auto bg-background">
      <div className="flex-1 p-8 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
        
        <h1 className="text-[1.35rem] font-semibold tracking-tight text-foreground mb-1 text-center">
          Upload Knowledge
        </h1>
        <p className="text-[0.875rem] text-muted-foreground mb-8 text-center">
          Add documents directly to the AI-Research-Assistant context.
        </p>

        <div className="w-full mb-12">
          <FileDropzone />
        </div>

        <div className="text-center w-full max-w-sm">
          <p className="text-[0.8125rem] font-medium text-muted-foreground/70 mb-4 pb-2 border-b border-[hsl(var(--border))]">
            Processing pipeline
          </p>
<<<<<<< HEAD
          <ul className="text-[0.8125rem] text-muted-foreground space-y-2 text-left w-max mx-auto list-disc list-inside">
            <li>Text extraction</li>
            <li>Semantic chunking</li>
            <li>Vector embedding</li>
            <li>Retrieval indexing</li>
          </ul>
=======
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FORMAT_INFO.map((f) => (
              <div
                key={f.ext}
                className="flex items-start gap-3 px-3 py-2.5 rounded-xl glass hover:border-primary/40 transition-colors shadow-sm"
              >
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
                  {f.ext}
                </span>
                <div>
                  <p className="text-xs font-medium text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.note}</p>
                </div>
              </div>
            ))}
          </div>
>>>>>>> 9ef3b2057a678c678dfdd46a2744ae1ed3780ccc
        </div>
      </div>
    </div>
  );
}
