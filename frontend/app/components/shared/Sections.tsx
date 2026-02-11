import React from "react";
import { cn } from "@/app/lib/utils";

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-3xl font-bold">{title}</h2>}
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

interface ContentGridProps {
  children: React.ReactNode;
  cols?: "1" | "2" | "3" | "4";
  gap?: "small" | "medium" | "large";
  className?: string;
}

const colClasses = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 md:grid-cols-2",
  "3": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  "4": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

const gapClasses = {
  small: "gap-4",
  medium: "gap-6",
  large: "gap-8",
};

export function ContentGrid({
  children,
  cols = "3",
  gap = "medium",
  className,
}: ContentGridProps) {
  return (
    <div className={cn("grid", colClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
