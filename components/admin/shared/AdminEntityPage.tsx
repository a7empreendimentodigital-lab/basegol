"use client";

import { EntityPage, type EntityFormProps } from "@/components/crud/EntityPage";
import type { AdminColumn } from "@/components/admin/shared/AdminDataTable";

type Props<T extends { id: string }> = {
  entity: string;
  title: string;
  description?: string;
  columns: AdminColumn<T>[];
  searchPlaceholder?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  extraParams?: Record<string, string | undefined>;
  toolbarExtras?: React.ReactNode;
  FormComponent: React.ComponentType<EntityFormProps>;
};

export function AdminEntityPage<T extends { id: string }>(props: Props<T>) {
  return <EntityPage {...props} apiBase="/api/admin/crud" />;
}

export type { EntityFormProps };
