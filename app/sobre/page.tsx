import Link from "next/link";
import { Eye, Target, Users } from "lucide-react";
import { PortalEntryHeader } from "@/components/portal/PortalEntryHeader";
import { PortalEntryFooter } from "@/components/portal/PortalEntryFooter";

export const metadata = {
  title: "Sobre — BaseGol",
  description: "Conheça a missão, visão e valores da BaseGol.",
};

const VALUES = [
  "Transparência",
  "Compromisso",
  "Inovação",
  "Paixão pelo futebol de base",
] as const;

export default function SobrePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-pitch">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-pitch via-graphite/20 to-pitch"
        aria-hidden
      />
      <PortalEntryHeader activePath="/sobre" searchPlaceholder="Buscar campeonatos..." />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Sobre a BaseGol
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-wide sm:text-4xl">
              O futuro do futebol <span className="text-primary">de base.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A BaseGol nasceu para transformar a forma como acompanhamos e valorizamos o
              futebol de base — conectando campeonatos, clubes, atletas e torcedores em um só
              lugar.
            </p>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl border border-line/50 bg-gradient-to-br from-primary/20 via-graphite to-pitch flex items-end p-6"
            aria-hidden
          >
            <p className="text-sm text-muted-foreground">
              Plataforma dedicada ao futebol de formação paulista e regional.
            </p>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-line/60 bg-graphite/40 p-6">
            <Target className="h-6 w-6 text-primary mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide">Nossa Missão</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Dar visibilidade aos jovens talentos e aos campeonatos de base, conectando clubes,
              atletas, famílias e torcedores.
            </p>
          </article>
          <article className="rounded-2xl border border-line/60 bg-graphite/40 p-6">
            <Eye className="h-6 w-6 text-primary mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide">Nossa Visão</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Ser a principal plataforma de referência do futebol de base no Brasil, impulsionando
              sonhos e revelando talentos.
            </p>
          </article>
          <article className="rounded-2xl border border-line/60 bg-graphite/40 p-6">
            <Users className="h-6 w-6 text-primary mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide">Nossos Valores</h2>
            <ul className="mt-3 space-y-2">
              {VALUES.map((v) => (
                <li key={v} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          <Link href="/" className="text-primary hover:underline">
            Ver campeonatos disponíveis
          </Link>
        </p>
      </main>

      <PortalEntryFooter />
    </div>
  );
}
