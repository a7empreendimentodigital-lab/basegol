import { FavoritosPageContent } from "@/components/favorites/FavoritosPageContent";
import { PublicRightSidebarLayout } from "@/components/layout/PublicRightSidebarLayout";

export const metadata = { title: "Favoritos" };

export default function FavoritosPage() {
  return (
    <PublicRightSidebarLayout>
      <FavoritosPageContent />
    </PublicRightSidebarLayout>
  );
}
