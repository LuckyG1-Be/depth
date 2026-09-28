"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = {
  id: string;
  title?: string;
  message: string;
  kind?: "success" | "error" | "info";
  ttlMs?: number;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const ttlMs = typeof t.ttlMs === "number" ? t.ttlMs : 3200;

    const next: Toast = { id, ...t, ttlMs };
    setToasts((prev) => [...prev, next]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, ttlMs);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-20 z-[999] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cls(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              "bg-black/70",
              t.kind === "success" && "border-emerald-500/30",
              t.kind === "error" && "border-rose-500/30",
              (!t.kind || t.kind === "info") && "border-white/10"
            )}
          >
            {t.title ? <div className="text-sm font-semibold text-white">{t.title}</div> : null}
            <div className="text-sm text-white/80">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { toast: () => {} };
  }
  return ctx;
}
