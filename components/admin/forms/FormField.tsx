import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({ label, htmlFor, error, children, className }: Props) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-1.5 block">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
