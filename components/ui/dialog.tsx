"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title?: string;
  description?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-graphite p-6 shadow-2xl neon-border",
          className
        )}
        {...props}
      >
        {(title || description) && (
          <div className="mb-4 pr-8">
            {title && <DialogPrimitive.Title className="text-lg font-semibold text-neon">{title}</DialogPrimitive.Title>}
            {description && (
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
        )}
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-secondary">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
