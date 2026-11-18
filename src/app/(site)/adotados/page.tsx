import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { Pagination } from "@/components/catalog/pagination";
import { Button } from "@/components/ui/button";
import { parseFilters, searchAnimals } from "@/lib/data/animals";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Finais felizes — animais adotados",
  description: "Conheça os animais que já encontraram um lar pelo AdoteAmigo e as histórias de quem adotou.",
  alternates: { canonical: "/adotados" },
};

type SP = Record<string, string | string[] | undefined>;

export default async function AdotadosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const supabase = await createClient();
  const [result, stories] = await Promise.all([
    searchAnimals(filters, { status: "adotado" }),
    supabase
      .from("adoption_stories")
      .select("id, title, body, created_at, animals(name, slug), profiles(full_name)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Finais felizes"
        title="Eles encontraram um lar"
        description={<>Já são <strong>{result.total}</strong> animais adotados pelo AdoteAmigo. Cada um deles é a prova de que adotar transforma vidas.</>}
      />
      <div className="container-page py-12">
        {(stories.data?.length ?? 0) > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-2xl font-semibold text-sage-900">Histórias de adoção</h2>
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {stories.data!.map((s) => {
                const animal = s.animals as unknown as { name: string; slug: string } | null;
                const author = s.profiles as unknown as { full_name: string } | null;
                return (
                  <article key={s.id} className="mb-5 break-inside-avoid rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60">
                    <Heart className="size-5 fill-apricot-300 text-apricot-300" />
                    <h3 className="mt-2 text-lg font-semibold text-sage-900">{s.title}</h3>
                    <p className="mt-2 whitespace-pre-line text-sage-800">{s.body}</p>
                    <p className="mt-4 text-sm text-muted-foreground">
                      {author?.full_name ?? "Usuário"} · {formatDate(s.created_at)}
                      {animal && <> · <Link href={`/animais/${animal.slug}`} className="font-semibold text-sage-700 hover:underline">{animal.name}</Link></>}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <h2 className="mb-6 text-2xl font-semibold text-sage-900">Animais adotados</h2>
        {result.items.length > 0 ? (
          <AnimalGrid>{result.items.map((a) => <AnimalCard key={a.id} animal={a} />)}</AnimalGrid>
        ) : (
          <p className="rounded-3xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">Ainda não há adoções registradas.</p>
        )}
        <Pagination page={result.page} total={result.total} pageSize={result.pageSize} basePath="/adotados" searchParams={sp} />

        <div className="mt-14 rounded-[2rem] bg-sage-700 p-8 text-center text-white">
          <p className="font-display text-2xl font-semibold">Sua história pode ser a próxima.</p>
          <Button asChild variant="accent" size="lg" className="mt-5"><Link href="/animais">Encontrar um animal</Link></Button>
        </div>
      </div>
    </>
  );
}
