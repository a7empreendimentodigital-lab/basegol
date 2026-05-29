"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (item: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...item, id }].slice(-4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "glass-card border p-4 shadow-lg animate-in slide-in-from-right-5 flex gap-3",
              t.variant === "success" && "border-neon/40",
              t.variant === "error" && "border-red-500/40",
              t.variant === "info" && "border-border"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-neon shrink-0" />}
            {t.variant === "error" && <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />}
            {t.variant === "info" && <Info className="h-5 w-5 text-muted-foreground shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
