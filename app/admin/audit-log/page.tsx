"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";

type AuditItem = {
  id: string;
  action: string;
  user?: string;
  entity?: string;
  entityId?: string;
  impersonatedUserId?: string;
  createdAt: string;
};

export default function AuditLogAdminPage() {
  const [logs, setLogs] = useState<AuditItem[]>([]);

  useEffect(() => {
    void fetch("/api/admin/audit-logs")
      .then(async (r) => {
        if (!r.ok) return [] as AuditItem[];
        return parseApiResponse<AuditItem[]>(r);
      })
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <div className="space-y-4 max-w-6xl">
      <h1 className="font-display text-3xl text-neon">Audit Log</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Ações administrativas recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-muted-foreground">
                {log.user ?? "sistema"} · {new Date(log.createdAt).toLocaleString("pt-BR")}
              </p>
              {(log.entity || log.entityId || log.impersonatedUserId) && (
                <p className="text-xs text-neon">
                  {log.entity ?? "Entity"} {log.entityId ?? ""} {log.impersonatedUserId ? `→ ${log.impersonatedUserId}` : ""}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
