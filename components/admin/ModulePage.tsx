import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ModulePage({
  title,
  subtitle,
  ctaLabel = "Novo registro",
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
}) {
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-neon">{title}</h1>
        <Button>{ctaLabel}</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Gestão operacional</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{subtitle}</CardContent>
      </Card>
    </div>
  );
}
