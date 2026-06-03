import { FavoritosPageContent } from "@/components/favorites/FavoritosPageContent";

export const metadata = { title: "Favoritos" };

export default function FavoritosPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <FavoritosPageContent />
    </div>
  );
}
