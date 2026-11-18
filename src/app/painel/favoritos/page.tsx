import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { ShareFavorites } from "@/components/dashboard/share-favorites";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Meus favoritos" };

export default async function FavoritosPage() {
  const user = await requireUser("/painel/favoritos");
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("created_at, animals(id, slug, name, species, species_other, breed, age_group, sex, size, uf, status, special_needs, cities(name), animal_images(storage_path, is_primary, position), profiles!animals_owner_id_fkey(is_verified))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Animais suspensos/removidos deixam de ser visíveis pelo RLS e somem da lista automaticamente.
  const cards = (data ?? []).flatMap((f) => {
    const a = f.animals as unknown as {
      id: string; slug: string; name: string; species: "cachorro" | "gato" | "outro"; species_other: string | null; breed: string | null;
      age_group: "filhote" | "jovem" | "adulto" | "idoso"; sex: "macho" | "femea"; size: "pequeno" | "medio" | "grande"; uf: string;
      status: "disponivel" | "adotado" | "pausado" | "suspenso" | "removido"; special_needs: boolean; cities: { name: string } | null;
      animal_images: { storage_path: string; is_primary: boolean; position: number }[]; profiles: { is_verified: boolean } | null;
    } | null;
    if (!a) return [];
    const img = [...a.animal_images].sort((x, y) => Number(y.is_primary) - Number(x.is_primary) || x.position - y.position)[0];
    return [{ ...a, city_name: a.cities?.name ?? "", image_path: img?.storage_path ?? null, owner_verified: a.profiles?.is_verified ?? false }];
  });
  const available = cards.filter((c) => c.status === "disponivel");
  const others = cards.filter((c) => c.status !== "disponivel");

  return (
    <>
      <DashHeader
        title="Meus favoritos"
        description="Acompanhe o status atualizado dos animais que você salvou."
        action={cards.length > 0 ? <ShareFavorites slugs={available.map((a) => ({ name: a.name, slug: a.slug }))} /> : undefined}
      />
      {cards.length === 0 ? (
        <EmptyState icon={<Heart />} title="Nenhum favorito ainda" description="Toque no coração dos animais que chamarem sua atenção para salvá-los aqui."
          action={<Button asChild><Link href="/animais">Explorar animais</Link></Button>} />
      ) : (
        <div className="space-y-10">
          {available.length > 0 && (
            <AnimalGrid className="xl:grid-cols-3">
              {available.map((a) => <AnimalCard key={a.id} animal={a} isFavorite isLoggedIn />)}
            </AnimalGrid>
          )}
          {others.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-sage-900">Não estão mais disponíveis</h2>
              <AnimalGrid className="xl:grid-cols-3">
                {others.map((a) => <AnimalCard key={a.id} animal={a} isFavorite isLoggedIn className="opacity-80" />)}
              </AnimalGrid>
            </section>
          )}
        </div>
      )}
    </>
  );
}
