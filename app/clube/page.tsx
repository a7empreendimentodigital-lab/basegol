"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserRoundCog, FileText, Calendar, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseApiResponse } from "@/lib/api-client";

type Dash = {
  clubName?: string;
  athletes: number;
  staff: number;
  documentsPending: number;
  registrations: number;
  upcomingMatches: number;
};

export default function ClubeDashboardPage() {
  const [data, setData] = useState<Dash | null>(null);

  useEffect(() => {
    void fetch("/api/club/dashboard")
      .then(async (r) => (r.ok ? parseApiResponse<Dash>(r) : null))
      .then(setData);
  }, []);

  const cards = [
    { label: "Atletas", value: data?.athletes, href: "/clube/atletas", icon: Users },
    { label: "Comissão", value: data?.staff, href: "/clube/comissao", icon: UserRoundCog },
    { label: "Docs pendentes", value: data?.documentsPending, href: "/clube/documentos", icon: FileText },
    { label: "Inscrições", value: data?.registrations, href: "/clube/inscricoes", icon: ClipboardList },
    { label: "Próximos jogos", value: data?.upcomingMatches, href: "/clube/jogos", icon: Calendar },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="font-display text-4xl text-neon">{data?.clubName ?? "Área do Clube"}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, href, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="h-full hover:border-line transition-colors border-line">
              <CardHeader className="flex flex-row justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
                <Icon className="h-4 w-4 text-neon" />
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl text-neon">{value ?? "—"}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
