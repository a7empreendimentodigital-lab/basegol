import { cn } from "@/lib/utils";

/** Abas em pílula (campeonatos, tabelas). */
export const publicTabTriggerClass = cn(
  "inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-2 text-sm font-medium transition-colors",
  "text-muted-foreground hover:bg-graphite/60 hover:text-foreground",
  "data-[state=active]:border-foreground data-[state=active]:bg-foreground data-[state=active]:text-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

/** Abas em pílula com largura igual (detalhe do jogo). */
export const publicTabTriggerClassFlex = cn(
  publicTabTriggerClass,
  "flex-1 justify-center px-4 py-2.5",
  "disabled:opacity-40 disabled:pointer-events-none"
);

export const categoryPillBase =
  "rounded-full border px-2 py-2 text-[11px] font-medium leading-tight text-center transition-colors border-line bg-pitch/50 text-muted-foreground hover:bg-graphite/60 hover:text-foreground";

export const categoryPillBaseMd =
  "rounded-full border px-3 py-2 text-sm font-medium transition-colors border-line bg-pitch/50 text-muted-foreground hover:bg-graphite/60 hover:text-foreground";

export const categoryPillActive =
  "border-foreground bg-foreground text-background hover:bg-foreground hover:text-background";

/** Lista / bloco público sem caixa com borda — só divisores */
export const publicListShell = "flex w-full flex-col divide-y divide-line/60";

export const publicEmptyShell =
  "flex w-full flex-col items-center justify-center py-10 text-center sm:py-12";

export const publicSectionDivider = "border-b border-line/60";

export const publicSectionBlock = "py-4 sm:py-5";

/** Linha de lista pública com respiro (detalhe de clube, etc.) */
export const publicListRow = "block py-6 transition-colors hover:bg-graphite/40 sm:py-7";
