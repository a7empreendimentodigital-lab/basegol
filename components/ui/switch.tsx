"use client";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
};

export function Switch({ checked, onCheckedChange, id, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-border transition-colors",
        checked ? "bg-selected" : "bg-secondary",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform translate-y-0.5",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
