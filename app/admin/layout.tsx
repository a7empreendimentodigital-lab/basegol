import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isLegacyChampionshipAdminPath,
  legacyChampionshipAdminRedirect,
} from "@/lib/admin-legacy-routes";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { authOptions } from "@/lib/auth";
import { getBrandConfig } from "@/lib/site-config";
import { getServerSession } from "next-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [brand, session, headerList] = await Promise.all([
    getBrandConfig(),
    getServerSession(authOptions),
    headers(),
  ]);
  const userRole = session?.user?.role ?? null;
  const pathname = headerList.get("x-pathname") ?? "";
  const championshipId = session?.user?.championshipId;

  if (isLegacyChampionshipAdminPath(pathname)) {
    redirect(legacyChampionshipAdminRedirect(championshipId));
  }

  if (
    userRole?.toUpperCase() === "ADMIN_CAMPEONATO" &&
    championshipId &&
    (pathname === "/admin" || pathname === "/admin/campeonatos")
  ) {
    redirect(`/admin/campeonatos/${championshipId}`);
  }

  return (
    <div className="min-h-screen flex bg-pitch">
      <AdminSidebar userRole={userRole} championshipId={championshipId} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminMobileHeader
          mobileLogoUrl={brand?.mobileLogoUrl ?? null}
          systemName={brand?.systemName ?? "BASEGOL"}
          userRole={userRole}
          championshipId={championshipId}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
