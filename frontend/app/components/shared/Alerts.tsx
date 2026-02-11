import React from "react";
import { cn } from "@/app/lib/utils";

interface ErrorAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = "Error",
  message,
  onClose,
  className,
}: ErrorAlertProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 space-y-2",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 flex-shrink-0 ml-4"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface SuccessAlertProps {
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function SuccessAlert({
  title = "Success",
  message,
  onClose,
  className,
}: SuccessAlertProps) {
  return (
    <div
      className={cn(
        "p-4 rounded-lg bg-green-50 border border-green-200 text-green-900 space-y-2",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-green-600 hover:text-green-800 flex-shrink-0 ml-4"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
