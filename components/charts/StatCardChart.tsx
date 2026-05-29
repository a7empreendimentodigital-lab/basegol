"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardChartProps = {
  title: string;
  value: string | number;
  trend?: string;
};

export function StatCardChart({ title, value, trend }: StatCardChartProps) {
  return (
    <Card className="neon-hover">
      <CardHeader className="pb-2">
        <CardTitle className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-4xl text-neon">{value}</p>
        {trend ? <p className="text-xs text-muted-foreground mt-1">{trend}</p> : null}
      </CardContent>
    </Card>
  );
}
