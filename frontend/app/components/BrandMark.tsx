import { Cat, Dog } from "lucide-react";
import { cn } from "../lib/utils";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    wrapper: "h-6 w-6",
    dog: "h-6 w-6",
    cat: "h-4 w-4",
  },
  md: {
    wrapper: "h-8 w-8",
    dog: "h-8 w-8",
    cat: "h-5 w-5",
  },
  lg: {
    wrapper: "h-10 w-10",
    dog: "h-10 w-10",
    cat: "h-6 w-6",
  },
};

export default function BrandMark({ size = "md", className }: BrandMarkProps) {
  const styles = sizeClasses[size];

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex items-center justify-center text-primary",
        styles.wrapper,
        className,
      )}
    >
      <Dog className={cn(styles.dog, "opacity-90")} strokeWidth={2.2} />
      {/* <Cat
        className={cn(
          "absolute -bottom-0.5 -right-1 text-foreground/80",
          styles.cat,
        )}
        strokeWidth={2.3}
      /> */}
    </span>
  );
}
