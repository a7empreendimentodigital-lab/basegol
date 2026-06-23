"use client";

import { useState } from "react";
import { FileUp, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { uploadFileToApi } from "@/lib/upload-client";

type Props = {
  value?: string | null;
  fileName?: string | null;
  onChange: (url: string | null, fileName?: string | null) => void;
  label?: string;
};

export function FileUpload({ value, fileName, onChange, label = "Arquivo" }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadFileToApi(file, {
        allowDocuments: true,
        category: "general",
        title: file.name,
      });
      onChange(url, file.name);
      toast({ title: "Arquivo enviado", variant: "success" });
    } catch (e) {
      toast({
        title: "Erro no upload",
        description: e instanceof Error ? e.message : "",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/30">
          <span className="text-sm truncate">{fileName || value}</span>
          <Button type="button" variant="destructive" size="sm" onClick={() => onChange(null, null)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <label className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-line p-6 cursor-pointer hover:bg-secondary/50">
        <input
          type="file"
          className="hidden"
          accept=".pdf,image/*"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
          }}
        />
        {uploading ? <Loader2 className="h-6 w-6 animate-spin text-neon" /> : <FileUp className="h-6 w-6 text-muted-foreground" />}
        <span className="text-xs text-muted-foreground">PDF ou imagem — máx. 5MB</span>
      </label>
    </div>
  );
}
