import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-pitch">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminMobileHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
