"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/format";
import type { PropertyImage } from "@/lib/types";

export function ImageGallery({ images, title }: { images: PropertyImage[]; title: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-slate-400">No images</div>;
  }

  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
        <Image src={resolveImageUrl(active.url)} alt={title} fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" priority />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                i === activeIndex ? "border-teal-600" : "border-transparent"
              }`}
            >
              <Image src={resolveImageUrl(img.url)} alt={`${title} thumbnail ${i + 1}`} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
