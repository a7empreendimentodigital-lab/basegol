import { Card, CardContent } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) {
  return (
    <Card className="neon-hover">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-display text-4xl text-neon">{value}</p>
        {helper ? <p className="text-xs text-muted-foreground mt-1">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
