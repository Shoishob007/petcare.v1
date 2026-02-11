import React from "react";
import { cn } from "@/app/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  className,
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn("h-12 bg-gray-200 rounded-lg animate-pulse", className)}
        />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="h-6 bg-gray-200 rounded mb-4 w-3/4 animate-pulse" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
      </div>
    </div>
  );
}
