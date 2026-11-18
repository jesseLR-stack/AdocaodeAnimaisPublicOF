import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import {
  AlertTriangle, BadgeCheck, CalendarDays, ChevronRight, Eye, Info, MapPin, Pencil, ShieldAlert, Sparkles,
} from "lucide-react";
import { AnimalGallery } from "@/components/animals/animal-gallery";
import { AnimalActions } from "@/components/animals/animal-actions";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds, searchAnimals } from "@/lib/data/animals";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import {
  AGE_HINT, AGE_LABEL, HEALTH_LABEL, PROFILE_TYPE_LABEL, SEX_LABEL, SIZE_LABEL, SPECIES_LABEL, STATUS_LABEL,
} from "@/lib/constants";
import { formatAge, formatDate, initials, storageUrl } from "@/lib/format";
import { SITE_URL } from "@/lib/env";
import { cn } from "@/lib/utils";

const getAnimal = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("animals")
    .select(`*, cities(name), animal_images(id, storage_path, position, is_primary, alt_text),
      owner:profiles!animals_owner_id_fkey(id, slug, full_name, avatar_url, profile_type, is_verified, created_at, uf, cities(name))`)
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimal(slug);
  if (!a) return { title: "Animal não encontrado" };
  const city = (a.cities as { name: string } | null)?.name;
  const img = [...(a.animal_images ?? [])].sort((x, y) => Number(y.is_primary) - Number(x.is_primary) || x.position - y.position)[0];
  const title = `${a.name} — ${SPECIES_LABEL[a.species]} para adoção em ${city}/${a.uf}`;
  const description = a.description.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `/animais/${a.slug}` },
    robots: a.status === "disponivel" || a.status === "adotado" ? undefined : { index: false },
    openGraph: {
      title, description, type: "article", url: `/animais/${a.slug}`,
      images: img ? [{ url: storageUrl(img.storage_path)!, alt: `Foto de ${a.name}` }] : [{ url: "/opengraph-image" }],
    },
  };
}

function Fact({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-3.5 ring-1 ring-border/60">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-display text-lg leading-tight font-semibold text-sage-900">{value}</dd>
      {hint && <dd className="text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function HealthItem({ label, value }: { label: string; value: keyof typeof HEALTH_LABEL }) {
  const tone = value === "sim" ? "success" : value === "parcial" ? "warning" : value === "nao" ? "danger" : "outline";
  return (
    <li className="flex items-center justify-between rounded-xl bg-cream-100 px-4 py-3">
      <span className="font-medium text-sage-800">{label}</span>
      <Badge variant={tone}>{HEALTH_LABEL[value]}</Badge>
    </li>
  );
}

export default async function AnimalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const animal = await getAnimal(slug);
  if (!animal) notFound();

  const user = await getCurrentUser();
  const supabase = await createClient();
  const isOwner = user?.id === animal.owner_id;
  const owner = animal.owner as unknown as {
    id: string; slug: string; full_name: string; avatar_url: string | null; profile_type: keyof typeof PROFILE_TYPE_LABEL;
    is_verified: boolean; created_at: string; uf: string | null; cities: { name: string } | null;
  } | null;
  const city = (animal.cities as { name: string } | null)?.name ?? "";
  const images = [...(animal.animal_images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position);

  const [favoriteIds, interest, similar] = await Promise.all([
    getFavoriteIds(user?.id),
    user && !isOwner
      ? supabase.from("adoption_interests").select("id").eq("animal_id", animal.id).eq("interested_id", user.id).neq("status", "cancelado").maybeSingle()
      : Promise.resolve({ data: null }),
    searchAnimals({ especie: [animal.species], uf: animal.uf }, { pageSize: 5 }),
  ]);

  if (!isOwner) {
    after(async () => {
      await createPublicClient().rpc("increment_animal_view", { p_animal: animal.id });
    });
  }

  const unverified = !animal.health_verified;
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Animais para adoção", item: `${SITE_URL}/animais` },
      { "@type": "ListItem", position: 3, name: animal.name, item: `${SITE_URL}/animais/${animal.slug}` },
    ],
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }} />
      <nav aria-label="Trilha" className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/animais" className="hover:text-sage-900 hover:underline">Animais</Link>
        <ChevronRight className="size-4" />
        <Link href={`/animais?especie=${animal.species}`} className="hover:text-sage-900 hover:underline">{SPECIES_LABEL[animal.species]}</Link>
        <ChevronRight className="size-4" />
        <span className="truncate font-medium text-sage-900">{animal.name}</span>
      </nav>

      {animal.status !== "disponivel" && (
        <div className={cn(
          "mb-6 flex items-start gap-3 rounded-2xl p-4",
          animal.status === "adotado" ? "bg-sage-100 text-sage-800" : "bg-apricot-100 text-sage-900",
        )}>
          {animal.status === "adotado" ? <Sparkles className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
          <p className="text-sm font-medium">
            {animal.status === "adotado" && `${animal.name} já foi adotado(a)${animal.adopted_at ? ` em ${formatDate(animal.adopted_at)}` : ""}! Que tal conhecer outros animais?`}
            {animal.status === "pausado" && "Este anúncio está pausado pelo anunciante e não aparece nas buscas."}
            {(animal.status === "suspenso" || animal.status === "removido") &&
              `Este anúncio está ${STATUS_LABEL[animal.status].toLowerCase()} pela moderação${animal.status_reason ? `: ${animal.status_reason}` : "."}`}
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:gap-12">
        <div className="min-w-0">
          <AnimalGallery images={images} name={animal.name} species={animal.species} />

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={animal.status === "disponivel" ? "success" : "cream"}>{STATUS_LABEL[animal.status]}</Badge>
              {animal.special_needs && <Badge variant="accent">Necessidades especiais</Badge>}
              {animal.temperament.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
            <h1 className="mt-3 text-4xl font-semibold text-sage-900 sm:text-5xl">{animal.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sage-700">
              <span className="flex items-center gap-1"><MapPin className="size-4 text-apricot-500" /> {city}, {animal.uf}{animal.region ? ` · ${animal.region}` : ""}</span>
              <span className="flex items-center gap-1"><CalendarDays className="size-4" /> Publicado em {formatDate(animal.published_at)}</span>
              <span className="flex items-center gap-1"><Eye className="size-4" /> {animal.view_count} visualizações</span>
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Espécie" value={animal.species === "outro" ? animal.species_other ?? "Outro" : SPECIES_LABEL[animal.species]} />
            <Fact label="Raça" value={animal.breed || "Sem raça definida"} />
            <Fact label="Idade aproximada" value={formatAge(animal.age_months) ?? AGE_LABEL[animal.age_group]} hint={`${AGE_LABEL[animal.age_group]} · ${AGE_HINT[animal.age_group]}`} />
            <Fact label="Sexo e porte" value={`${SEX_LABEL[animal.sex]} · ${SIZE_LABEL[animal.size]}`} />
          </dl>

          <section className="mt-10">
            <h2 className="text-2xl font-semibold text-sage-900">Sobre {animal.name}</h2>
            <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-sage-800">{animal.description}</p>
          </section>

          {animal.story && (
            <section className="mt-8 rounded-3xl bg-cream-200/70 p-6">
              <h2 className="text-xl font-semibold text-sage-900">A história de {animal.name}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-line text-sage-800">{animal.story}</p>
            </section>
          )}

          {(animal.personality || animal.good_with.length > 0) && (
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-sage-900">Personalidade</h2>
              {animal.personality && <p className="mt-2 leading-relaxed whitespace-pre-line text-sage-800">{animal.personality}</p>}
              {animal.good_with.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-sage-700">
                  Convive bem com: {animal.good_with.map((g) => <Badge key={g}>{g}</Badge>)}
                </p>
              )}
            </section>
          )}

          <section className="mt-8 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-sage-900">Saúde</h2>
              {unverified ? (
                <Badge variant="warning"><Info /> Informações declaradas — não verificadas</Badge>
              ) : (
                <Badge variant="success"><BadgeCheck /> Verificado pela equipe</Badge>
              )}
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              <HealthItem label="Vacinado" value={animal.vaccinated} />
              <HealthItem label="Castrado" value={animal.neutered} />
              <HealthItem label="Vermifugado" value={animal.dewormed} />
            </ul>
            {animal.vet_info && <p className="mt-4 whitespace-pre-line text-sage-800"><strong>Observações veterinárias:</strong> {animal.vet_info}</p>}
            {animal.special_needs && animal.special_needs_details && (
              <div className="mt-4 rounded-2xl bg-apricot-100 p-4">
                <p className="font-semibold text-sage-900">Necessidades especiais</p>
                <p className="mt-1 whitespace-pre-line text-sage-800">{animal.special_needs_details}</p>
              </div>
            )}
            {unverified && (
              <p className="mt-4 text-xs text-muted-foreground">
                Estas informações foram fornecidas pelo anunciante e não foram conferidas pelo AdoteAmigo. Peça a
                carteira de vacinação e leve o animal a um veterinário após a adoção.
              </p>
            )}
          </section>
        </div>

        {/* Coluna lateral */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[2rem] bg-white p-5 shadow-lift ring-1 ring-border/60 sm:p-6">
            {isOwner ? (
              <div className="space-y-3">
                <p className="font-display text-xl font-semibold text-sage-900">Este é o seu anúncio</p>
                <p className="text-sm text-muted-foreground">Mantenha as informações atualizadas e marque como adotado quando encontrar um lar.</p>
                <Button asChild size="lg" className="w-full"><Link href={`/painel/anuncios/${animal.id}/editar`}><Pencil /> Editar anúncio</Link></Button>
                <Button asChild size="lg" variant="outline" className="w-full"><Link href="/painel/interesses/recebidos">Ver interesses recebidos</Link></Button>
              </div>
            ) : (
              <AnimalActions
                animal={{
                  id: animal.id, name: animal.name, slug: animal.slug, status: animal.status,
                  acceptsMessages: animal.accepts_messages,
                  whatsappEnabled: animal.contact_preference !== "chat",
                }}
                isLoggedIn={!!user}
                alreadyInterested={!!interest.data}
                isFavorite={favoriteIds.has(animal.id)}
              />
            )}
          </div>

          {owner && (
            <div className="mt-4 rounded-[2rem] bg-white p-5 ring-1 ring-border/60">
              <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Anunciado por</p>
              <Link href={`/protetores/${owner.slug}`} className="group mt-3 flex items-center gap-3">
                <Avatar className="size-14 ring-4 ring-sage-50">
                  {owner.avatar_url && <AvatarImage src={storageUrl(owner.avatar_url, { bucket: "avatars" }) ?? undefined} alt="" />}
                  <AvatarFallback className="text-base">{initials(owner.full_name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-semibold text-sage-900 group-hover:underline">
                    <span className="truncate">{owner.full_name}</span>
                    {owner.is_verified && <BadgeCheck className="size-4 shrink-0 text-sage-500" aria-label="Perfil verificado" />}
                  </span>
                  <span className="block text-sm text-muted-foreground">{PROFILE_TYPE_LABEL[owner.profile_type]}</span>
                  <span className="block text-xs text-muted-foreground">
                    {owner.cities?.name ? `${owner.cities.name}, ${owner.uf} · ` : ""}No AdoteAmigo desde {new Date(owner.created_at).getFullYear()}
                  </span>
                </span>
              </Link>
              {!owner.is_verified && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Perfil não verificado. O tipo de perfil é declarado pelo próprio usuário.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-3 rounded-[2rem] bg-apricot-100 p-5 text-sm text-sage-800">
            <ShieldAlert className="size-5 shrink-0 text-apricot-600" />
            <p>
              <strong>Nunca pague para adotar.</strong> Pedidos de PIX, taxas ou frete antecipado são sinais de golpe.{" "}
              <Link href="/adocao-responsavel" className="font-semibold underline">Dicas de segurança</Link>
            </p>
          </div>
        </aside>
      </div>

      {similar.items.filter((a) => a.id !== animal.id).length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold text-sage-900">Outros {SPECIES_LABEL[animal.species].toLowerCase()}s em {animal.uf}</h2>
          <AnimalGrid>
            {similar.items.filter((a) => a.id !== animal.id).slice(0, 4).map((a) => (
              <AnimalCard key={a.id} animal={a} isFavorite={favoriteIds.has(a.id)} isLoggedIn={!!user} />
            ))}
          </AnimalGrid>
        </section>
      )}
    </div>
  );
}
