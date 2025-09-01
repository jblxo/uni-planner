"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  onCancel,
  onConfirm,
  requireText,
  confirmLabel = "Confirm",
  variant = "destructive",
}: {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  requireText?: string; // e.g. "DELETE"
  confirmLabel?: string;
  variant?: "default" | "destructive";
}) {
  const [text, setText] = useState("");
  useEffect(() => { if (!open) setText(""); }, [open]);
  const ok = !requireText || text.trim() === requireText;
  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onCancel() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-neutral-700 dark:text-neutral-300">{message}</div>
        {requireText && (
          <input
            autoFocus
            className="mt-3 w-full rounded border border-neutral-300 dark:border-neutral-700 bg-transparent px-2 py-1"
            placeholder={`Type ${requireText} to confirm`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant={variant} disabled={!ok} onClick={onConfirm}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

