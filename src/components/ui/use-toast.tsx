"use client";

import * as React from "react";

type ToastOptions = {
  title: string;
  description?: string;
};

type ToastItem = ToastOptions & { id: number };

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((options: ToastOptions) => {
    const id = Date.now() + Math.random();
    const item: ToastItem = { id, ...options };
    setToasts((prev) => [...prev, item]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return { toast, toasts };
}

export function ToastRoot({ toasts }: { toasts: ToastItem[] }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-root">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <div style={{ fontWeight: 600, marginBottom: t.description ? 4 : 0 }}>{t.title}</div>
          {t.description && <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>{t.description}</div>}
        </div>
      ))}
    </div>
  );
}

