"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useMemo, useState } from "react";

type MediaMosaicProps = {
    images: string[];
    alt: string;
    className?: string;
    tileClassName?: string;
};

export default function MediaMosaic({ images, alt, className, tileClassName }: MediaMosaicProps) {
    const [open, setOpen] = useState(false);
    const [index, setIndex] = useState(0);

    const visible = useMemo(() => images.slice(0, 4), [images]);
    const remaining = images.length - visible.length;

    if (!images.length) return null;

    function openAt(nextIndex: number) {
        setIndex(nextIndex);
        setOpen(true);
    }

    const gridClass =
        images.length === 1
            ? "grid-cols-1"
            : images.length === 2
                ? "grid-cols-2"
                : "grid-cols-2";

    return (
        <>
            <div className={`grid ${gridClass} gap-2 ${className || ""}`}>
                {visible.map((image, mediaIndex) => {
                    const isCoverTile = mediaIndex === 3 && remaining > 0;
                    return (
                        <button
                            key={`${image}-${mediaIndex}`}
                            type="button"
                            onClick={() => openAt(mediaIndex)}
                            className={`relative overflow-hidden rounded-2xl border border-outline-variant/25 ${tileClassName || ""}`}
                        >
                            <img src={image} alt={alt} className="h-44 w-full object-cover md:h-52" />
                            {isCoverTile ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-extrabold text-white">
                                    +{remaining}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>

            {open ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4">
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white"
                        aria-label="Close gallery"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    {index > 0 ? (
                        <button
                            type="button"
                            onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    ) : null}

                    <div className="w-full max-w-6xl">
                        <img
                            src={images[index]}
                            alt={`${alt} ${index + 1}`}
                            className="max-h-[76vh] w-full rounded-2xl object-contain"
                        />

                        <div className="mt-3 flex items-center justify-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold text-white">
                                <Images className="h-3.5 w-3.5" />
                                {index + 1} / {images.length}
                            </span>
                        </div>

                        <div className="mt-3 flex flex-wrap justify-center gap-2">
                            {images.map((image, thumbIndex) => (
                                <button
                                    key={`${image}-${thumbIndex}`}
                                    type="button"
                                    onClick={() => setIndex(thumbIndex)}
                                    className={`overflow-hidden rounded-lg border ${thumbIndex === index ? "border-white" : "border-white/30"}`}
                                >
                                    <img src={image} alt={`${alt} thumbnail ${thumbIndex + 1}`} className="h-14 w-14 object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {index < images.length - 1 ? (
                        <button
                            type="button"
                            onClick={() => setIndex((prev) => Math.min(images.length - 1, prev + 1))}
                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2 text-white"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    ) : null}
                </div>
            ) : null}
        </>
    );
}
