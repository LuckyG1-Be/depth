"use client";

import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Bevestigen",
  cancelText = "Annuleren",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="border border-zinc-800 bg-zinc-950">
          <div className="text-lg font-semibold text-zinc-50">{title}</div>
          <div className="mt-2 text-sm text-zinc-300">{message}</div>

          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant={danger ? "primary" : "secondary"} onClick={onConfirm}>
              {confirmText}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
