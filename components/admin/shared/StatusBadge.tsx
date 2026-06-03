import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const VARIANTS: Record<string, string> = {
  ACTIVE: "bg-selected/20 text-white border-line",
  APPROVED: "bg-selected/20 text-white border-line",
  LIVE: "bg-red-600 text-white border-red-600",
  HALFTIME: "bg-red-600 text-white border-red-600",
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  PENDING_DOCS: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  DRAFT: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  FINISHED: "bg-blue-600/30 text-blue-50 border-blue-400/50",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
  SUSPENDED: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  INACTIVE: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  SCHEDULED: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  REGISTRATION: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};

type Props = {
  status: string;
  label: string;
};

export function StatusBadge({ status, label }: Props) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium", VARIANTS[status] ?? "")}>
      {label}
    </Badge>
  );
}
