import React from "react";
import { cn } from "@/app/lib/utils";

interface BadgeProps {
  variant?: "default" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: "bg-blue-100 text-blue-800",
  secondary: "bg-gray-100 text-gray-800",
  success: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  danger: "bg-red-100 text-red-800",
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1 text-sm",
};

export function SharedBadge({
  variant = "default",
  size = "md",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface StatusIndicatorProps {
  status: "active" | "inactive" | "pending" | "error";
  label?: string;
  className?: string;
}

const statusColors = {
  active: "bg-green-500",
  inactive: "bg-gray-400",
  pending: "bg-yellow-500",
  error: "bg-red-500",
};

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
  pending: "Pending",
  error: "Error",
};

export function StatusIndicator({
  status,
  label,
  className,
}: StatusIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("w-2 h-2 rounded-full", statusColors[status])} />
      <span className="text-sm text-muted-foreground">
        {label || statusLabels[status]}
      </span>
    </div>
  );
}
