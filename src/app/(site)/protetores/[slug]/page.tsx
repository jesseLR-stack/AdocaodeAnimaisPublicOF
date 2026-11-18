import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AtSign, BadgeCheck, CalendarDays, Globe, MapPin } from "lucide-react";
import { AnimalCard, AnimalGrid } from "@/components/animals/animal-card";
import { ReportDialog } from "@/components/animals/report-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/data/animals";
import { createClient } from "@/lib/supabase/server";
import { PROFILE_TYPE_LABEL } from "@/lib/constants";
import { initials, storageUrl } from "@/lib/format";

const getProfile = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, slug, full_name, avatar_url, bio, profile_type, is_verified, uf, created_at, account_status, cities(name), organizations(name, description, website, instagram)")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProfile((await params).slug);
  if (!p) return { title: "Perfil não encontrado" };
  return {
    title: `${p.full_name} — ${PROFILE_TYPE_LABEL[p.profile_type]}`,
    description: p.bio?.slice(0, 155) ?? `Animais para adoção anunciados por ${p.full_name} no AdoteAmigo.`,
    alternates: { canonical: `/protetores/${p.slug}` },
  };
}

export default async function ProtetorPage({ params }: { params: Promise<{ slug: string }> }) {
  const profile = await getProfile((await params).slug);
  if (!profile) notFound();
  const user = await getCurrentUser();
  const supabase = await createClient();
  const [{ data: animals }, favoriteIds] = await Promise.all([
    supabase
      .from("animals")
      .select("id, slug, name, species, species_other, breed, age_group, sex, size, uf, status, special_needs, cities(name), animal_images(storage_path, is_primary, position)")
      .eq("owner_id", profile.id)
      .in("status", ["disponivel", "adotado"])
      .order("status")
      .order("published_at", { ascending: false })
      .limit(48),
    getFavoriteIds(user?.id),
  ]);
  const org = (profile.organizations as unknown as { name: string; description: string | null; website: string | null; instagram: string | null }[] | null)?.[0];
  const cards = (animals ?? []).map((a) => {
    const img = [...a.animal_images].sort((x, y) => Number(y.is_primary) - Number(x.is_primary) || x.position - y.position)[0];
    return { ...a, city_name: (a.cities as { name: string } | null)?.name ?? "", image_path: img?.storage_path ?? null, owner_verified: profile.is_verified };
  });
  const available = cards.filter((c) => c.status === "disponivel");
  const adopted = cards.filter((c) => c.status === "adotado");

  return (
    <div className="container-page py-10">
      <section className="flex flex-col gap-6 rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-border/60 sm:flex-row sm:items-center sm:p-8">
        <Avatar className="size-24 ring-8 ring-sage-50">
          {profile.avatar_url && <AvatarImage src={storageUrl(profile.avatar_url, { bucket: "avatars" }) ?? undefined} alt="" />}
          <AvatarFallback className="text-2xl">{initials(profile.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="cream">{PROFILE_TYPE_LABEL[profile.profile_type]}</Badge>
            {profile.is_verified ? (
              <Badge variant="success"><BadgeCheck /> Perfil verificado pela equipe</Badge>
            ) : (
              <Badge variant="outline">Perfil não verificado</Badge>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-sage-900 sm:text-4xl">{profile.full_name}</h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {(profile.cities as { name: string } | null)?.name && (
              <span className="flex items-center gap-1"><MapPin className="size-4" />{(profile.cities as { name: string }).name}, {profile.uf}</span>
            )}
            <span className="flex items-center gap-1"><CalendarDays className="size-4" />No AdoteAmigo desde {new Date(profile.created_at).getFullYear()}</span>
            {org?.website && <a href={org.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:underline"><Globe className="size-4" />Site</a>}
            {org?.instagram && <a href={`https://instagram.com/${org.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 hover:underline"><AtSign className="size-4" />{org.instagram}</a>}
          </p>
          {(org?.description || profile.bio) && <p className="mt-3 max-w-2xl whitespace-pre-line text-sage-800">{org?.description || profile.bio}</p>}
        </div>
        {user?.id !== profile.id && (
          <div className="sm:self-start"><ReportDialog targetType="usuario" targetId={profile.id} isLoggedIn={!!user} /></div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-semibold text-sage-900">Disponíveis para adoção ({available.length})</h2>
        {available.length ? (
          <AnimalGrid>{available.map((a) => <AnimalCard key={a.id} animal={a} isFavorite={favoriteIds.has(a.id)} isLoggedIn={!!user} />)}</AnimalGrid>
        ) : <p className="text-muted-foreground">Nenhum animal disponível no momento.</p>}
      </section>
      {adopted.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-semibold text-sage-900">Já adotados ({adopted.length})</h2>
          <AnimalGrid>{adopted.map((a) => <AnimalCard key={a.id} animal={a} />)}</AnimalGrid>
        </section>
      )}
    </div>
  );
}
