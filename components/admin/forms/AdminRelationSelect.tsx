"use client";

import { useEffect } from "react";
import type { FieldValues, Path, UseFormReset, UseFormSetValue } from "react-hook-form";
import { Select } from "@/components/ui/select";
import type { SelectOption } from "@/hooks/use-admin-options";

type Props<T extends FieldValues> = {
  name: Path<T>;
  value: string;
  options: SelectOption[];
  optionsLoading: boolean;
  setValue: UseFormSetValue<T>;
  reset: UseFormReset<T>;
  /** Só re-sincroniza ao editar, quando as opções terminam de carregar */
  syncWhenReady?: boolean;
  getValuesForReset?: () => T;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Select controlado para relações carregadas via API — evita perder o valor no editar
 * quando as opções ainda não existiam no primeiro render.
 */
export function AdminRelationSelect<T extends FieldValues>({
  name,
  value,
  options,
  optionsLoading,
  setValue,
  reset,
  syncWhenReady = false,
  getValuesForReset,
  placeholder = "Selecione...",
  disabled = false,
  className,
}: Props<T>) {
  useEffect(() => {
    if (!syncWhenReady || optionsLoading || options.length === 0 || !getValuesForReset) return;
    reset(getValuesForReset());
  }, [syncWhenReady, optionsLoading, options.length, reset, getValuesForReset]);

  const hasValue = value.length > 0;
  const valueInOptions = hasValue && options.some((o) => o.value === value);

  return (
    <Select
      className={className}
      value={value}
      disabled={disabled || (optionsLoading && !hasValue)}
      onChange={(e) => setValue(name, e.target.value as T[Path<T>], { shouldValidate: true })}
    >
      <option value="">
        {optionsLoading && !hasValue
          ? "Carregando..."
          : hasValue && !valueInOptions && optionsLoading
            ? "Carregando..."
            : placeholder}
      </option>
      {hasValue && !valueInOptions ? (
        <option value={value}>Selecionado</option>
      ) : null}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
