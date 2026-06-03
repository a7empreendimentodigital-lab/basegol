import Link from "next/link";
import { ChevronRight, LogOut, User } from "lucide-react";
import { publicListShell } from "@/lib/public-ui-classes";
import { cn } from "@/lib/utils";

const items = [
  { href: "/configuracoes/perfil", label: "Perfil", description: "Foto, nome e telefone", icon: User },
] as const;

export const metadata = { title: "Configurações" };

export default function ConfiguracoesPage() {
  return (
    <main className="mx-auto w-full max-w-lg space-y-4 px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-foreground">Configurações</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
        </div>

        <nav className={publicListShell}>
          {items.map(({ href, label, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-4 py-4 transition-colors",
                "hover:bg-graphite/40"
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-pitch/40">
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60" aria-hidden />
            </Link>
          ))}

          <Link
            href="/api/auth/signout"
            className={cn(
              "flex items-center gap-4 py-4 transition-colors",
              "hover:bg-graphite/40"
            )}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-pitch/40">
              <LogOut className="h-5 w-5 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">Sair</p>
              <p className="text-xs text-muted-foreground">Encerrar sessão</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/60" aria-hidden />
          </Link>
        </nav>
    </main>
  );
}
