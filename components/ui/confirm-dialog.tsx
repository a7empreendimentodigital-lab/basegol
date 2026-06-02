"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

type ConfirmState = ConfirmOptions & {
  open: boolean;
};

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result);
    resolveRef.current = null;
    setState(null);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  const variant = state?.variant ?? "default";
  const destructive = variant === "destructive";

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <DialogPrimitive.Root
        open={Boolean(state?.open)}
        onOpenChange={(open) => {
          if (!open) close(false);
        }}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-1/2 top-1/2 z-[110] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
              "rounded-xl border border-border bg-graphite p-6 shadow-2xl",
              destructive ? "border-red-500/30" : "neon-border"
            )}
          >
            <div className="flex gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  destructive ? "bg-red-500/15 text-red-400" : "bg-neon/10 text-neon"
                )}
              >
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <DialogPrimitive.Title className="text-base font-semibold text-foreground pr-2">
                  {state?.title}
                </DialogPrimitive.Title>
                {state?.description ? (
                  <DialogPrimitive.Description className="mt-2 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {state.description}
                  </DialogPrimitive.Description>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                {state?.cancelLabel ?? "Cancelar"}
              </Button>
              <Button
                type="button"
                variant={destructive ? "destructive" : "default"}
                onClick={() => close(true)}
              >
                {state?.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx;
}
