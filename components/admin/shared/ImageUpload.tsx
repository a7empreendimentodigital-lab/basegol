"use client";

import { useCallback, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { normalizeImageSrc } from "@/lib/image-url";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import type { MediaCategory } from "@/lib/upload-config";
import { parseApiResponse } from "@/lib/api-client";

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  category?: MediaCategory;
  accept?: string;
  className?: string;
};

export function ImageUpload({
  value,
  onChange,
  label = "Imagem",
  category = "general",
  accept = "image/png,image/jpeg,image/webp,image/svg+xml",
  className,
}: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("category", category);
        form.append("title", file.name);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Falha no upload");
        }
        const { url } = await parseApiResponse<{ url: string; assetId: string }>(res);
        if (!url) throw new Error("URL do upload não retornada");
        onChange(normalizeImageSrc(url));
        toast({ title: "Upload concluído", variant: "success" });
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
    [category, onChange, toast]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {value ? (
        <div className="relative rounded-lg border border-border overflow-hidden bg-secondary/50">
          <div className="relative h-40 w-full">
            <SafeImage src={value} alt="" fill className="object-contain p-2" />
          </div>
          <div className="flex gap-2 p-2 border-t border-border bg-black/40">
            <label className="flex-1">
              <input
                type="file"
                accept={accept}
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f);
                }}
              />
              <Button type="button" variant="outline" size="sm" className="w-full" asChild disabled={uploading}>
                <span>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  Substituir
                </span>
              </Button>
            </label>
            <Button type="button" variant="destructive" size="sm" onClick={() => onChange(null)} disabled={uploading}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors",
            dragOver ? "border-line bg-secondary/50" : "border-line bg-secondary/30"
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-neon" />
          ) : (
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-xs text-muted-foreground text-center">
            Arraste uma imagem ou clique para selecionar
            <br />
            PNG, JPG, WEBP ou SVG — máx. 5MB
          </p>
          <label>
            <input
              type="file"
              accept={accept}
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadFile(f);
              }}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
              <span>Selecionar imagem</span>
            </Button>
          </label>
        </div>
      )}
    </div>
  );
}
