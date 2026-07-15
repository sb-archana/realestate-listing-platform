"use client";

import { useEffect, useMemo } from "react";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
}

export function ImageUploader({ files, onChange, maxFiles = 8 }: Props) {
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    onChange([...files, ...selected].slice(0, maxFiles));
    e.target.value = "";
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600">Photos (up to {maxFiles}, JPG/PNG/WebP)</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelect}
        disabled={files.length >= maxFiles}
        className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-700"
      />
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a remote image */}
              <img src={src} alt={`Upload preview ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
