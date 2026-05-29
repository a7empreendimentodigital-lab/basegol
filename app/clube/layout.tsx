"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  FileText,
  Trophy,
  Calendar,
  UserRoundCog,
  ClipboardList,
  ChartColumn,
  Bell,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const clubNav = [
  { href: "/clube", label: "Painel", icon: Trophy },
  { href: "/clube/atletas", label: "Atletas", icon: Users },
  { href: "/clube/comissao", label: "Comissão", icon: UserRoundCog },
  { href: "/clube/documentos", label: "Documentos", icon: FileText },
  { href: "/clube/inscricoes", label: "Inscrições", icon: ClipboardList },
  { href: "/clube/jogos", label: "Jogos", icon: Calendar },
  { href: "/clube/estatisticas", label: "Estatísticas", icon: ChartColumn },
  { href: "/clube/notificacoes", label: "Notificações", icon: Bell },
  { href: "/clube/perfil", label: "Perfil", icon: Shield },
];

export default function ClubeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="border-b border-line bg-graphite/50 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {clubNav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/clube" ? pathname === "/clube" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 shrink-0 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "nav-active" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}
