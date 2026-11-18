import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, BadgeCheck, Cat, Dog, Heart, HeartHandshake, MessageCircleHeart, PawPrint,
  Rabbit, ShieldCheck, Sparkles, Stethoscope, Baby, Armchair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { HeroSearch } from "@/components/home/hero-search";
import { SectionHeading } from "@/components/home/section-heading";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds, searchAnimals } from "@/lib/data/animals";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_TYPE_LABEL } from "@/lib/constants";
import { formatDate, initials, storageUrl } from "@/lib/format";

const CATEGORIES = [
  { href: "/animais?especie=cachorro", label: "Cães", icon: Dog, tone: "bg-sage-100 text-sage-700" },
  { href: "/animais?especie=gato", label: "Gatos", icon: Cat, tone: "bg-apricot-100 text-apricot-600" },
  { href: "/animais?especie=outro", label: "Outros animais", icon: Rabbit, tone: "bg-cream-200 text-beige-500" },
  { href: "/animais?idade=filhote", label: "Filhotes", icon: Baby, tone: "bg-apricot-100 text-apricot-600" },
  { href: "/animais?idade=idoso", label: "Idosos", icon: Armchair, tone: "bg-sage-100 text-sage-700" },
  { href: "/animais?especiais=sim", label: "Cuidados especiais", icon: Stethoscope, tone: "bg-cream-200 text-beige-500" },
];

const STEPS = [
  { icon: PawPrint, title: "Encontre", text: "Use os filtros para achar um animal compatível com a sua rotina e a sua casa." },
  { icon: MessageCircleHeart, title: "Converse", text: "Demonstre interesse e converse com o anunciante pelo chat ou WhatsApp." },
  { icon: HeartHandshake, title: "Adote com responsabilidade", text: "Conheça o animal, combine a adoção com cuidado e prepare a casa para recebê-lo." },
];

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [featured, recent, adopted, stats, stories, orgs, favoriteIds] = await Promise.all([
    searchAnimals({ ordem: "visualizados" }, { pageSize: 4 }),
    searchAnimals({ ordem: "recentes" }, { pageSize: 8 }),
    searchAnimals({}, { status: "adotado", pageSize: 3 }),
    supabase.rpc("public_stats"),
    supabase
      .from("adoption_stories")
      .select("id, title, body, created_at, animals(name, slug, species), profiles(full_name, avatar_url)")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("profiles")
      .select("id, slug, full_name, avatar_url, profile_type, is_verified, uf, cities(name), animals!animals_owner_id_fkey(count)")
      .in("profile_type", ["ong_abrigo", "protetor_independente", "organizacao_parceira"])
      .eq("account_status", "ativo")
      .order("is_verified", { ascending: false })
      .limit(8),
    getFavoriteIds(user?.id),
  ]);

  const s = (stats.data ?? {}) as { available?: number; adopted?: number; advertisers?: number; cities?: number };
  const heroAnimals = featured.items.length ? featured.items : recent.items;
  const recentIds = new Set(featured.items.map((a) => a.id));
  const recentItems = recent.items.filter((a) => !recentIds.has(a.id)).slice(0, 8);
  const featuredOrgs = (orgs.data ?? [])
    .map((o) => ({ ...o, count: (o.animals as unknown as { count: number }[])[0]?.count ?? 0 }))
    .sort((a, b) => Number(b.is_verified) - Number(a.is_verified) || b.count - a.count)
    .slice(0, 4);

  return (
    <>
      {/* ------------------------------------------------------------------ HERO */}
      <section className="relative overflow-hidden bg-paper">
        <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 size-[34rem] rounded-full bg-sage-200/50 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-apricot-200/40 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:py-24">
          <div className="flex min-w-0 animate-fade-up flex-col items-start">
            <Badge variant="outline" className="mb-5 gap-1.5 px-3 py-1 text-sm">
              <Sparkles className="text-apricot-500" /> Adoção responsável em todo o Brasil
            </Badge>
            <h1 className="text-[2.6rem] leading-[1.05] font-semibold text-balance text-sage-900 sm:text-6xl lg:text-[4.2rem]">
              Uma nova história começa com uma <span className="relative whitespace-nowrap text-apricot-500">
                adoção
                <svg aria-hidden viewBox="0 0 200 20" className="absolute -bottom-2 left-0 w-full" preserveAspectRatio="none">
                  <path d="M3 14c50-10 140-12 194-4" fill="none" stroke="var(--apricot-300)" strokeWidth="5" strokeLinecap="round" />
                </svg>
              </span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-sage-700">
              Conectamos cães, gatos e outros animais que precisam de um lar a pessoas, protetores e ONGs
              que acreditam em adoção com carinho e responsabilidade.
            </p>
            <div className="mt-8 w-full"><HeroSearch /></div>
            <dl className="mt-8 grid w-full max-w-lg grid-cols-3 gap-3">
              {[
                { label: "esperando um lar", value: s.available ?? 0 },
                { label: "finais felizes", value: s.adopted ?? 0 },
                { label: "cidades", value: s.cities ?? 0 },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/70 px-3 py-3 ring-1 ring-border/60 backdrop-blur">
                  <dt className="text-xs font-semibold text-muted-foreground">{item.label}</dt>
                  <dd className="font-display text-2xl font-semibold text-sage-800">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Colagem de animais reais do banco */}
          <div className="relative mx-auto hidden h-[520px] w-full max-w-[480px] sm:block" aria-hidden>
            {[0, 1, 2].map((i) => {
              const a = heroAnimals[i];
              const pos = [
                "left-0 top-10 w-[58%] -rotate-6",
                "right-0 top-0 w-[52%] rotate-[5deg] [animation-delay:1.5s]",
                "left-[22%] bottom-0 w-[54%] rotate-2 [animation-delay:3s]",
              ][i];
              return (
                <div key={i} className={`absolute animate-float rounded-[2rem] bg-white p-2.5 pb-4 shadow-lift ${pos}`}>
                  <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-cream-200">
                    {a?.image_path ? (
                      <Image src={storageUrl(a.image_path, { thumb: true })!} alt="" fill sizes="280px" className="object-cover" priority={i === 0} />
                    ) : (
                      <AnimalIllustration species={a?.species ?? (["cachorro", "gato", "outro"] as const)[i]!} seed={a?.name ?? String(i)} />
                    )}
                  </div>
                  <p className="mt-2.5 px-2 font-display text-lg font-semibold text-sage-900">{a?.name ?? ["Paçoca", "Mel", "Biscoito"][i]}</p>
                  <p className="px-2 text-xs text-muted-foreground">{a ? `${a.city_name}, ${a.uf}` : "Esperando por você"}</p>
                </div>
              );
            })}
            <div className="absolute top-[46%] -right-2 flex animate-float items-center gap-2 rounded-full bg-sage-700 px-4 py-2 text-sm font-semibold text-white shadow-lift [animation-delay:2s]">
              <Heart className="size-4 fill-apricot-300 text-apricot-300" /> Adote, não compre
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ CATEGORIAS */}
      <section className="container-page py-14" aria-labelledby="categorias">
        <h2 id="categorias" className="sr-only">Categorias</h2>
        <ul className="flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {CATEGORIES.map(({ href, label, icon: Icon, tone }) => (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className="group flex w-32 flex-col items-center gap-3 rounded-3xl bg-white px-4 py-5 text-center shadow-soft ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-lift sm:w-auto"
              >
                <span className={`flex size-14 items-center justify-center rounded-2xl transition group-hover:scale-110 group-hover:-rotate-6 ${tone}`}>
                  <Icon className="size-7" />
                </span>
                <span className="text-sm font-bold text-sage-800">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------------- DESTAQUES */}
      {featured.items.length > 0 && (
        <section className="container-page py-8">
          <SectionHeading eyebrow="Em destaque" title="Eles estão chamando atenção" description="Os animais mais visitados da semana." href="/animais?ordem=visualizados" />
          <AnimalGrid>
            {featured.items.map((a, i) => (
              <AnimalCard key={a.id} animal={a} isFavorite={favoriteIds.has(a.id)} isLoggedIn={!!user} priority={i < 2} />
            ))}
          </AnimalGrid>
        </section>
      )}

      {/* ---------------------------------------------------------- CTA ANUNCIAR */}
      <section className="container-page py-14">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-sage-700 px-6 py-10 text-white sm:px-12 sm:py-14">
          <div aria-hidden className="absolute -top-20 -right-16 size-72 rounded-full bg-sage-500/40" />
          <div aria-hidden className="absolute -bottom-24 right-40 size-56 rounded-full bg-apricot-400/30" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="text-3xl font-semibold text-balance sm:text-4xl">Precisa encontrar um novo lar para um animal?</h2>
              <p className="mt-3 max-w-xl text-sage-100">
                Pessoas físicas, protetores independentes e ONGs podem anunciar gratuitamente. A publicação é
                imediata e você conversa com interessados com segurança, sem expor seu telefone.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild variant="accent" size="lg"><Link href="/painel/anuncios/novo">Anunciar gratuitamente</Link></Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Link href="/adocao-responsavel">Como funciona</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- RECENTES */}
      <section className="container-page py-8">
        <SectionHeading eyebrow="Recém-chegados" title="Acabaram de chegar ao AdoteAmigo" href="/animais" />
        {recentItems.length > 0 ? (
          <AnimalGrid>
            {recentItems.map((a) => (
              <AnimalCard key={a.id} animal={a} isFavorite={favoriteIds.has(a.id)} isLoggedIn={!!user} />
            ))}
          </AnimalGrid>
        ) : featured.items.length === 0 ? (
          <EmptyAnimals />
        ) : null}
      </section>

      {/* ------------------------------------------------------- COMO FUNCIONA */}
      <section className="bg-cream-200/60 py-16">
        <div className="container-page">
          <SectionHeading eyebrow="Como funciona" title="Três passos até um novo melhor amigo" />
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60">
                <span className="absolute top-5 right-6 font-display text-5xl font-semibold text-cream-200">{i + 1}</span>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700"><Icon className="size-6" /></span>
                <h3 className="mt-4 text-xl font-semibold text-sage-900">{title}</h3>
                <p className="mt-2 text-sage-700">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------- HISTÓRIAS DE ADOÇÃO */}
      <section className="container-page py-16">
        <SectionHeading eyebrow="Finais felizes" title="Histórias que começaram aqui" href="/adotados" linkLabel="Ver adotados" />
        {(stories.data?.length ?? 0) > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {stories.data!.map((st) => {
              const author = st.profiles as unknown as { full_name: string; avatar_url: string | null } | null;
              const animal = st.animals as unknown as { name: string; slug: string } | null;
              return (
                <figure key={st.id} className="flex flex-col rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60">
                  <Heart className="size-6 fill-apricot-300 text-apricot-300" />
                  <h3 className="mt-3 text-lg font-semibold text-sage-900">{st.title}</h3>
                  <blockquote className="mt-2 line-clamp-5 text-sage-700">“{st.body}”</blockquote>
                  <figcaption className="mt-auto flex items-center gap-3 pt-5 text-sm">
                    <Avatar className="size-9">
                      {author?.avatar_url && <AvatarImage src={storageUrl(author.avatar_url, { bucket: "avatars" }) ?? undefined} alt="" />}
                      <AvatarFallback>{initials(author?.full_name ?? "A")}</AvatarFallback>
                    </Avatar>
                    <span>
                      <span className="font-semibold text-sage-900">{author?.full_name ?? "Usuário"}</span>
                      <span className="block text-muted-foreground">
                        {animal ? <Link href={`/animais/${animal.slug}`} className="hover:underline">com {animal.name}</Link> : formatDate(st.created_at)}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        ) : adopted.items.length > 0 ? (
          <AnimalGrid className="md:grid-cols-3 xl:grid-cols-3">
            {adopted.items.map((a) => <AnimalCard key={a.id} animal={a} />)}
          </AnimalGrid>
        ) : (
          <p className="rounded-3xl bg-white p-8 text-center text-muted-foreground ring-1 ring-border/60">
            As primeiras histórias de adoção aparecerão aqui. Que tal escrever a próxima?
          </p>
        )}
      </section>

      {/* ------------------------------------------------- ONGS E PROTETORES */}
      {featuredOrgs.length > 0 && (
        <section className="container-page py-8">
          <SectionHeading eyebrow="Quem faz acontecer" title="ONGs e protetores em destaque" href="/protetores" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredOrgs.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/protetores/${o.slug}`}
                  className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60 transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <Avatar className="size-14 ring-4 ring-sage-50">
                    {o.avatar_url && <AvatarImage src={storageUrl(o.avatar_url, { bucket: "avatars" }) ?? undefined} alt="" />}
                    <AvatarFallback className="text-base">{initials(o.full_name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold text-sage-900">
                      <span className="truncate">{o.full_name}</span>
                      {o.is_verified && <BadgeCheck className="size-4 shrink-0 text-sage-500" aria-label="Verificado" />}
                    </span>
                    <span className="block text-xs text-muted-foreground">{PROFILE_TYPE_LABEL[o.profile_type]}</span>
                    <span className="block text-xs text-muted-foreground">
                      {(o.cities as unknown as { name: string } | null)?.name ?? ""}{o.uf ? `, ${o.uf}` : ""} · {o.count} {o.count === 1 ? "anúncio" : "anúncios"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ------------------------------------------- ADOÇÃO RESPONSÁVEL */}
      <section className="container-page py-16">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2.25rem] bg-apricot-100 p-6 sm:p-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-wider text-apricot-600 uppercase">Adoção responsável</p>
            <h2 className="mt-2 text-3xl font-semibold text-balance text-sage-900 sm:text-4xl">Adotar é um compromisso para a vida toda</h2>
            <p className="mt-3 text-sage-800">
              Antes de adotar, pense no espaço, no tempo e nos custos com alimentação, vacinas e veterinário.
              Desconfie de qualquer pedido de pagamento: no AdoteAmigo, animais não são vendidos.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/adocao-responsavel">Ler o guia de adoção responsável <ArrowRight /></Link>
            </Button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Nunca pague para adotar", d: "Taxas, PIX ou “frete” são sinais de golpe. Denuncie." },
              { icon: MessageCircleHeart, t: "Converse antes", d: "Conheça a rotina do animal e tire todas as dúvidas." },
              { icon: Stethoscope, t: "Confira a saúde", d: "Informações veterinárias são declaradas pelo anunciante." },
              { icon: HeartHandshake, t: "Encontro seguro", d: "Combine em local público e leve alguém com você." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="rounded-2xl bg-white/80 p-4">
                <Icon className="size-6 text-apricot-500" />
                <p className="mt-2 font-semibold text-sage-900">{t}</p>
                <p className="text-sm text-sage-700">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

function EmptyAnimals() {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white p-10 text-center ring-1 ring-border/60">
      <div className="size-28 overflow-hidden rounded-full"><AnimalIllustration species="cachorro" seed="vazio" /></div>
      <p className="mt-4 font-display text-xl font-semibold text-sage-900">Nenhum animal publicado ainda</p>
      <p className="mt-1 text-muted-foreground">Seja a primeira pessoa a anunciar um animal para adoção.</p>
      <Button asChild className="mt-5"><Link href="/painel/anuncios/novo">Anunciar um animal</Link></Button>
    </div>
  );
}

