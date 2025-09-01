"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastType = "success" | "info" | "error";
type Toast = { id: string; type: ToastType; message: string; timeout?: number };

type ToastContextValue = {
  toast: (t: { type?: ToastType; message: string; timeout?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: { type?: ToastType; message: string; timeout?: number }) => {
    const id = crypto.randomUUID();
    const item: Toast = { id, type: t.type ?? "info", message: t.message, timeout: t.timeout ?? 3000 };
    setToasts((prev) => [...prev, item]);
    if (item.timeout && item.timeout > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), item.timeout);
    }
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={
              "min-w-[240px] max-w-[360px] rounded-md px-3 py-2 text-sm shadow border " +
              (t.type === "success"
                ? "bg-green-600 text-white border-green-700"
                : t.type === "error"
                ? "bg-red-600 text-white border-red-700"
                : "bg-neutral-800 text-white border-neutral-700")
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="leading-snug">{t.message}</div>
              <button
                className="opacity-80 hover:opacity-100"
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx.toast;
}

