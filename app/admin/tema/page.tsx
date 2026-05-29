"use client";

import { AdminEntityPage } from "@/components/admin/shared/AdminEntityPage";
import { ThemeForm } from "@/components/admin/forms/ThemeForm";
import { Badge } from "@/components/ui/badge";

type Row = {
  id: string;
  name: string;
  isActive: boolean;
  primaryColor: string;
};

export default function AdminTemaPage() {
  return (
    <AdminEntityPage<Row>
      entity="theme_configs"
      title="Temas"
      description="Cores e aparência visual da plataforma."
      FormComponent={ThemeForm}
      columns={[
        { key: "name", header: "Tema", cell: (r) => r.name },
        {
          key: "color",
          header: "Primária",
          cell: (r) => (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 rounded border border-border" style={{ background: r.primaryColor }} />
              {r.primaryColor}
            </span>
          ),
        },
        {
          key: "active",
          header: "Ativo",
          cell: (r) =>
            r.isActive ? (
              <Badge variant="outline" className="text-neon border-neon/30">
                Ativo
              </Badge>
            ) : (
              "—"
            ),
        },
      ]}
    />
  );
}
