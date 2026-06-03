import { Mail, MapPin, Phone } from "lucide-react";
import { PortalInstitutionalShell } from "@/components/portal/PortalInstitutionalShell";
import { ContactForm } from "@/components/portal/ContactForm";

export const metadata = {
  title: "Contato — BaseGol",
  description: "Entre em contato com a equipe BaseGol.",
};

export default function ContatoPage() {
  return (
    <PortalInstitutionalShell activePath="/contato">
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#22c55e]">
              Entre em contato
            </p>
            <h1 className="mt-3 font-display text-3xl tracking-wide text-white sm:text-4xl">
              Fale com a <span className="text-[#22c55e]">BaseGol</span>
            </h1>
            <p className="mt-4 text-sm text-neutral-400 leading-relaxed">
              Estamos prontos para ouvir você. Envie sua mensagem, sugestão ou dúvida e nossa
              equipe entrará em contato.
            </p>

            <ul className="mt-8 space-y-5">
              <li className="flex gap-3">
                <Mail className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">E-mail</p>
                  <a
                    href="mailto:contato@basegol.com.br"
                    className="text-sm text-neutral-400 hover:text-[#22c55e]"
                  >
                    contato@basegol.com.br
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp</p>
                  <p className="text-sm text-neutral-400">(11) 99999-9999</p>
                </div>
              </li>
              <li className="flex gap-3">
                <MapPin className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-white">Endereço</p>
                  <p className="text-sm text-neutral-400">São Paulo — SP, Brasil</p>
                </div>
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </main>
    </PortalInstitutionalShell>
  );
}
