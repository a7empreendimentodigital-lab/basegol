"use client";

import { EntityPage, type EntityFormProps } from "@/components/crud/EntityPage";
import type { AdminColumn } from "@/components/admin/shared/AdminDataTable";

type Props<T extends { id: string }> = {
  entity: string;
  title: string;
  description?: string;
  columns: AdminColumn<T>[];
  searchPlaceholder?: string;
  backHref?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  FormComponent: React.ComponentType<EntityFormProps>;
};

export function ClubEntityPage<T extends { id: string }>(props: Props<T>) {
  return <EntityPage {...props} apiBase="/api/club/crud" backHref={props.backHref ?? "/clube"} />;
}
