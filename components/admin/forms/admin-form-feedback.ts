import type { ToastVariant } from "@/components/ui/toaster";

type ToastFn = (item: {
  title: string;
  description?: string;
  variant: ToastVariant;
}) => void;

export function saveErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "Não foi possível salvar. Tente novamente.";
}

export function notifySaveError(toast: ToastFn, error: unknown) {
  toast({
    title: "Não foi possível salvar",
    description: saveErrorMessage(error),
    variant: "error",
  });
}

export function notifySaveSuccess(toast: ToastFn, label = "Alterações salvas") {
  toast({ title: label, variant: "success" });
}
