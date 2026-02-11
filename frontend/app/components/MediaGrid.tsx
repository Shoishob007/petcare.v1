"use client";

type MediaItem = {
  id?: string;
  src: string;
  alt?: string;
};

type MediaGridProps = {
  items: MediaItem[];
};

export default function MediaGrid({ items }: MediaGridProps) {
  if (!items.length) return null;
  const visible = items.slice(0, 4);
  const extra = items.length - visible.length;
  const gridClass = `media-grid media-grid-${Math.min(visible.length, 4)}`;

  return (
    <div className={gridClass}>
      {visible.map((item, index) => (
        <div key={item.id ?? `${item.src}-${index}`} className="media-tile">
          <img src={item.src} alt={item.alt ?? "Post media"} loading="lazy" />
          {extra > 0 && index === visible.length - 1 && (
            <div className="media-overlay">+{extra}</div>
          )}
        </div>
      ))}
    </div>
  );
}
