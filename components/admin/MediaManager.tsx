"use client";

import { useCallback, useEffect, useState } from "react";
import { SafeImage } from "@/components/ui/SafeImage";
import { Copy, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { parseApiResponse } from "@/lib/api-client";
import { useToast } from "@/components/ui/toaster";
import { MEDIA_CATEGORIES } from "@/lib/upload-config";

type MediaItem = {
  id: string;
  url: string;
  title?: string | null;
  originalName?: string | null;
  type: string;
  category?: string | null;
  sizeBytes?: number | null;
  createdAt: string;
};

export function MediaManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "24" });
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (category) params.set("category", category);
      const res = await fetch(`/api/admin/media?${params}`);
      const data = await parseApiResponse<{ items: MediaItem[]; total: number }>(res);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast({ title: "Erro ao carregar mídia", variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [page, q, type, category, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).forEach((f) => form.append("files", f));
      form.append("category", category || "general");
      const res = await fetch("/api/upload/multiple", { method: "POST", body: form });
      const data = await parseApiResponse<{ uploaded: { url: string }[] }>(res);
      toast({ title: `${data.uploaded?.length ?? 0} arquivo(s) enviado(s)`, variant: "success" });
      await load();
    } catch (e) {
      toast({ title: "Erro no upload", description: e instanceof Error ? e.message : "", variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta mídia?")) return;
    const res = await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Mídia excluída", variant: "success" });
      await load();
    }
  }

  function copyUrl(url: string) {
    const full = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
    void navigator.clipboard.writeText(full);
    toast({ title: "URL copiada", variant: "success" });
  }

  const totalPages = Math.max(1, Math.ceil(total / 24));

  return (
    <div>
      <AdminPageHeader
        title="Biblioteca de mídia"
        description="Upload, organização e reutilização de imagens em toda a plataforma."
      />

      <div className="glass-card p-4 mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Pesquisar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="IMAGE">Imagem</option>
            <option value="DOCUMENT">Documento</option>
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Todas categorias</option>
            {MEDIA_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => (setPage(1), void load())}>
            Filtrar
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={uploading}
              onChange={(e) => void uploadFiles(e.target.files)}
            />
            <Button type="button" disabled={uploading} className="gap-2" asChild>
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload múltiplo
              </span>
            </Button>
          </label>
          <span className="text-xs text-muted-foreground">{total} arquivos · página {page}/{totalPages}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neon" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <div key={item.id} className="glass-card overflow-hidden group">
              <div className="relative aspect-square bg-secondary/50">
                {item.type === "IMAGE" ? (
                  <SafeImage src={item.url} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground p-2 text-center">
                    {item.originalName ?? "Documento"}
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1">
                <p className="text-[10px] truncate text-muted-foreground">{item.title ?? item.originalName}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => copyUrl(item.url)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => remove(item.id)}>
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2 mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Próxima
        </Button>
      </div>
    </div>
  );
}
