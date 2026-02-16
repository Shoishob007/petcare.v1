"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type MediaItem = {
  id?: string;
  src: string;
  alt?: string;
};

type MediaGridProps = {
  items: MediaItem[];
  previewLimit?: number;
};

export default function MediaGrid({ items, previewLimit }: MediaGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items.length) return null;

  const limit =
    typeof previewLimit === "number" && previewLimit > 0
      ? Math.floor(previewLimit)
      : 4;
  const hasExtra = items.length > limit;
  const maxVisible = hasExtra ? limit : items.length;
  const visible = items.slice(0, maxVisible);
  const gridClass = `media-grid media-grid-${Math.min(visible.length, 4)}`;

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const handleNextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <>
      <div className={gridClass}>
        {visible.map((item, index) => (
          <div
            key={item.id ?? `${item.src}-${index}`}
            className="media-tile cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(index)}
          >
            <img src={item.src} alt={item.alt ?? "Post media"} loading="lazy" />
            {hasExtra && index === visible.length - 1 && (
              <div
                className="media-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                  setLightboxOpen(true);
                }}
              >
                <span className="media-overlay-icon" aria-hidden>
                  All
                </span>
                <span className="media-overlay-count">{items.length} photos</span>
                <span className="media-overlay-label">Open gallery</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image Viewer */}
          <div className="flex-1 flex items-center justify-center max-w-4xl max-h-[80vh]">
            <button
              className="absolute left-4 text-white hover:text-gray-300"
              onClick={handlePrevImage}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <img
              src={items[currentIndex].src}
              alt={items[currentIndex].alt ?? "Post media"}
              className="max-w-full max-h-full object-contain rounded-lg"
            />

            <button
              className="absolute right-4 text-white hover:text-gray-300"
              onClick={handleNextImage}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Counter */}
          <div className="mt-4 text-white text-sm">
            {currentIndex + 1} of {items.length}
          </div>

          {/* Thumbnails */}
          {items.length > 1 && (
            <div className="mt-4 flex gap-2 max-w-2xl flex-wrap justify-center">
              {items.map((item, index) => (
                <button
                  key={item.id ?? `${item.src}-${index}`}
                  className={`w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === currentIndex
                      ? "border-white"
                      : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                >
                  <img
                    src={item.src}
                    alt={item.alt ?? "Thumbnail"}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
