import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";

export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/configuracoes/perfil");
  }

  return (
    <PublicRightSidebarLayout>
      <main className="w-full px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <ProfileForm />
      </main>
    </PublicRightSidebarLayout>
  );
}
