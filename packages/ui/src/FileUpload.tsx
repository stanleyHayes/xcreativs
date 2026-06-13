"use client";

import { useRef, useState } from "react";
import { Upload, Check, Loader2, X } from "lucide-react";
import { api } from "@xc/api";

interface FileUploadProps {
  /** Current uploaded URL (controlled). */
  value?: string;
  /** Called with the hosted URL (and original filename) after a successful upload, or "" when cleared. */
  onChange: (url: string, fileName?: string) => void;
  /** Cloudinary folder, e.g. "resumes", "logos", "deliverables". */
  folder?: string;
  /** HTML accept attribute, e.g. ".pdf,.doc,.docx" or "image/*". */
  accept?: string;
  label?: string;
  maxSizeMB?: number;
  className?: string;
}

/**
 * FileUpload uploads to the backend /uploads endpoint (Cloudinary) and reports
 * the resulting URL via onChange. Theme-agnostic: borders/text inherit the
 * surrounding color (works on both the light public pages and dark portal).
 */
export function FileUpload({
  value,
  onChange,
  folder,
  accept,
  label = "Upload a file",
  maxSizeMB = 15,
  className = "",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds ${maxSizeMB} MB`);
      return;
    }
    setError("");
    setUploading(true);
    setName(file.name);
    try {
      const res = await api.uploadFile(file, folder);
      onChange(res.url, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setName("");
    } finally {
      setUploading(false);
    }
  }

  // Prefer the just-uploaded filename; otherwise derive one from a preset value
  // (e.g. edit mode) so we never fall back to a generic label when we have a URL.
  const displayName =
    name ||
    (value ? decodeURIComponent(value.split("?")[0].split("/").pop() || "") : "") ||
    "Uploaded file";

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-2 text-sm border border-current/20 rounded-md px-3 py-2">
          <Check className="w-4 h-4 text-signal shrink-0" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="underline truncate flex-1"
          >
            {displayName}
          </a>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setName("");
            }}
            className="opacity-60 hover:opacity-100"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-current/25 px-4 py-2 text-sm transition-colors hover:border-signal disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> {label}
            </>
          )}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default FileUpload;
