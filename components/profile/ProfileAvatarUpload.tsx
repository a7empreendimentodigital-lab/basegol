"use client";

import { useCallback, useRef, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { uploadFileToApi } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  disabled?: boolean;
};

export function ProfileAvatarUpload({ name, imageUrl, onImageChange, disabled }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const { url } = await uploadFileToApi(file, {
          category: "avatar",
          title: `avatar-${file.name}`,
        });
        onImageChange(url);
        toast({ title: "Foto enviada", description: "Salve o perfil para confirmar.", variant: "success" });
      } catch (e) {
        toast({
          title: "Erro no upload",
          description: e instanceof Error ? e.message : "Tente novamente",
          variant: "error",
        });
      } finally {
        setUploading(false);
      }
    },
    [onImageChange, toast]
  );

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:gap-5">
      <div className="relative">
        <div
          className={cn(
            "relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-line bg-graphite-light",
            uploading && "opacity-60"
          )}
        >
          {imageUrl ? (
            <SafeImage src={imageUrl} alt="" fill className="object-cover" />
          ) : (
            <span className="text-3xl font-semibold text-muted-foreground">{initial}</span>
          )}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pitch/60">
              <Loader2 className="h-8 w-8 animate-spin text-foreground" aria-hidden />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-foreground text-background shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
          aria-label="Alterar foto"
        >
          <Camera className="h-4 w-4" aria-hidden />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="space-y-2 text-center sm:text-left">
        <p className="text-sm font-medium text-foreground">Foto do perfil</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          PNG, JPG ou WEBP — até 5 MB. A foto aparece no topo do site após salvar.
        </p>
        {imageUrl ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => onImageChange(null)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Remover foto
          </button>
        ) : null}
      </div>
    </div>
  );
}
