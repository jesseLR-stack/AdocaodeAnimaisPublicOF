import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CatalogResults, CatalogToolbar } from "@/components/catalog/catalog-toolbar";
import { Pagination } from "@/components/catalog/pagination";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds, parseFilters, searchAnimals } from "@/lib/data/animals";
import { SPECIES_PLURAL } from "@/lib/constants";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const f = parseFilters(await searchParams);
  const species = f.especie?.length === 1 ? SPECIES_PLURAL[f.especie[0]!] : "Cães, gatos e outros animais";
  const where = f.uf ? ` em ${f.uf}` : "";
  return {
    title: `${species} para adoção${where}`,
    description: `Encontre ${species.toLowerCase()} para adoção responsável${where}. Filtre por idade, porte, sexo, cidade e distância.`,
    alternates: { canonical: "/animais" },
  };
}

export default async function AnimaisPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const user = await getCurrentUser();
  const [result, favoriteIds] = await Promise.all([searchAnimals(filters), getFavoriteIds(user?.id)]);
  const userCity = user?.profile.city_id && user.profile.uf ? { id: user.profile.city_id, uf: user.profile.uf } : null;

  return (
    <div className="container-page py-8 sm:py-10">
      <h1 className="text-3xl font-semibold text-sage-900 sm:text-4xl">Encontre seu novo amigo</h1>
      <p className="mt-1 text-muted-foreground">Animais disponíveis para adoção responsável em todo o Brasil.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[290px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60">
            <Suspense><CatalogFilters userCity={userCity} /></Suspense>
          </div>
        </aside>

        <div className="min-w-0">
          <Suspense><CatalogToolbar total={result.total} userCity={userCity} /></Suspense>
          <div className="mt-6">
            <Suspense>
              <CatalogResults>
                {result.error ? (
                  <p className="rounded-3xl bg-red-50 p-6 text-red-800">Não foi possível carregar os animais agora. Tente novamente.</p>
                ) : result.items.length === 0 ? (
                  <div className="flex flex-col items-center rounded-3xl bg-white p-10 text-center ring-1 ring-border/60">
                    <div className="size-28 overflow-hidden rounded-full"><AnimalIllustration species="gato" seed="busca" /></div>
                    <p className="mt-4 font-display text-xl font-semibold text-sage-900">Nenhum animal com esses filtros</p>
                    <p className="mt-1 text-muted-foreground">Tente ampliar a distância ou remover alguns filtros.</p>
                    <Button asChild variant="outline" className="mt-5"><Link href="/animais">Limpar filtros</Link></Button>
                  </div>
                ) : (
                  <AnimalGrid className="xl:grid-cols-3">
                    {result.items.map((a, i) => (
                      <AnimalCard key={a.id} animal={a} isFavorite={favoriteIds.has(a.id)} isLoggedIn={!!user} priority={i < 3} />
                    ))}
                  </AnimalGrid>
                )}
              </CatalogResults>
            </Suspense>
            <Pagination page={result.page} total={result.total} pageSize={result.pageSize} basePath="/animais" searchParams={sp} />
          </div>
        </div>
      </div>
    </div>
  );
}
