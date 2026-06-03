import Link from "next/link";
import { Eye, Target, Users } from "lucide-react";
import { PortalInstitutionalShell } from "@/components/portal/PortalInstitutionalShell";

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
    <PortalInstitutionalShell activePath="/sobre">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#22c55e]">
              Sobre a BaseGol
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-wide text-white sm:text-4xl">
              O futuro do futebol <span className="text-[#22c55e]">de base.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              A BaseGol nasceu para transformar a forma como acompanhamos e valorizamos o
              futebol de base — conectando campeonatos, clubes, atletas e torcedores em um só
              lugar.
            </p>
          </div>
          <div
            className="aspect-[4/3] rounded-2xl border border-white/10 bg-gradient-to-br from-[#22c55e]/20 via-neutral-900 to-black flex items-end p-6"
            aria-hidden
          >
            <p className="text-sm text-neutral-400">
              Plataforma dedicada ao futebol de formação paulista e regional.
            </p>
          </div>
        </section>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
            <Target className="h-6 w-6 text-[#22c55e] mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide text-white">Nossa Missão</h2>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Dar visibilidade aos jovens talentos e aos campeonatos de base, conectando clubes,
              atletas, famílias e torcedores.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
            <Eye className="h-6 w-6 text-[#22c55e] mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide text-white">Nossa Visão</h2>
            <p className="mt-2 text-sm text-neutral-400 leading-relaxed">
              Ser a principal plataforma de referência do futebol de base no Brasil, impulsionando
              sonhos e revelando talentos.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
            <Users className="h-6 w-6 text-[#22c55e] mb-4" aria-hidden />
            <h2 className="font-display text-lg tracking-wide text-white">Nossos Valores</h2>
            <ul className="mt-3 space-y-2">
              {VALUES.map((v) => (
                <li key={v} className="flex items-center gap-2 text-sm text-neutral-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] shrink-0" aria-hidden />
                  {v}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <p className="mt-12 text-center text-sm text-neutral-500">
          <Link href="/" className="text-[#22c55e] hover:underline">
            Ver campeonatos disponíveis
          </Link>
        </p>
      </main>
    </PortalInstitutionalShell>
  );
}
