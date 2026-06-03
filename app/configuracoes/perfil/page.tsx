import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/configuracoes/perfil");
  }

  return (
    <main className="mx-auto w-full max-w-lg px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
      <ProfileForm />
    </main>
  );
}
