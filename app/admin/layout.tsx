import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";
import { authOptions } from "@/lib/auth";
import { getBrandConfig } from "@/lib/site-config";
import { getServerSession } from "next-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [brand, session] = await Promise.all([getBrandConfig(), getServerSession(authOptions)]);
  const userRole = session?.user?.role ?? null;

  return (
    <div className="min-h-screen flex bg-pitch">
      <AdminSidebar userRole={userRole} />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminMobileHeader
          mobileLogoUrl={brand?.mobileLogoUrl ?? null}
          systemName={brand?.systemName ?? "BASEGOL"}
          userRole={userRole}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
