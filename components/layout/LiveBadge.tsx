import { Badge } from "@/components/ui/badge";

export function LiveBadge() {
  return (
    <Badge variant="live" className="gap-1.5 uppercase tracking-wider">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Ao vivo
    </Badge>
  );
}
