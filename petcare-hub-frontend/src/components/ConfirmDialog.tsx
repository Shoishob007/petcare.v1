"use client";

import { motion } from "motion/react";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

export default function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Delete",
    cancelLabel = "Cancel",
    busy = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[#0d1b2a]/55 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md rounded-3xl border border-outline-variant/40 bg-surface-container-lowest p-6 shadow-[var(--shadow-editorial)]"
            >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-error-container text-lg">
                    ⚠️
                </div>
                <h3 className="font-headline text-2xl font-bold text-on-surface">{title}</h3>
                <p className="mt-2 text-sm text-on-surface-variant">{message}</p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-surface"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-xl bg-error px-4 py-2 text-sm font-bold text-on-error disabled:opacity-60"
                    >
                        {busy ? "Processing..." : confirmLabel}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
