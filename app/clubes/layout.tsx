import { ClubesLayoutShell } from "@/components/clubes/ClubesLayoutShell";

export const dynamic = "force-dynamic";

export default function ClubesLayout({ children }: { children: React.ReactNode }) {
  return <ClubesLayoutShell>{children}</ClubesLayoutShell>;
}
