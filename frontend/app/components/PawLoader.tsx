"use client";

type PawLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function PawLoader({
  label,
  size = "md",
  className = "",
}: PawLoaderProps) {
  return (
    <span
      className={`paw-loader paw-size-${size} ${className}`.trim()}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <span className="paw-loader-track" aria-hidden>
        <span className="paw-print">
          <span className="paw-toe toe-1" />
          <span className="paw-toe toe-2" />
          <span className="paw-toe toe-3" />
          <span className="paw-toe toe-4" />
          <span className="paw-pad" />
        </span>
        <span className="paw-print">
          <span className="paw-toe toe-1" />
          <span className="paw-toe toe-2" />
          <span className="paw-toe toe-3" />
          <span className="paw-toe toe-4" />
          <span className="paw-pad" />
        </span>
        <span className="paw-print">
          <span className="paw-toe toe-1" />
          <span className="paw-toe toe-2" />
          <span className="paw-toe toe-3" />
          <span className="paw-toe toe-4" />
          <span className="paw-pad" />
        </span>
      </span>
      {label && <span className="paw-loader-text">{label}</span>}
    </span>
  );
}
