import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Eye, Heart, Inbox, Pencil, PawPrint, Plus, TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { AnimalStatusControl } from "@/components/dashboard/animal-status-control";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL } from "@/lib/constants";
import { formatDate, storageUrl } from "@/lib/format";

export const metadata: Metadata = { title: "Meus anúncios" };

export default async function MeusAnunciosPage() {
  const user = await requireUser("/painel/anuncios");
  const supabase = await createClient();
  const { data } = await supabase
    .from("animals")
    .select("id, slug, name, species, status, status_reason, moderation_locked, view_count, published_at, updated_at, animal_images(storage_path, is_primary, position), favorite_count, adoption_interests(count)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const animals = data ?? [];

  return (
    <>
      <DashHeader
        title="Meus anúncios"
        description="Edite as informações, pause ou marque como adotado quando encontrar um lar."
        action={<Button asChild variant="accent"><Link href="/painel/anuncios/novo"><Plus /> Novo anúncio</Link></Button>}
      />
      {animals.length === 0 ? (
        <EmptyState icon={<PawPrint />} title="Nenhum anúncio ainda" description="Publique seu primeiro animal para adoção. É gratuito e leva poucos minutos."
          action={<Button asChild><Link href="/painel/anuncios/novo">Criar anúncio</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {animals.map((a) => {
            const img = [...a.animal_images].sort((x, y) => Number(y.is_primary) - Number(x.is_primary) || x.position - y.position)[0];
            const favs = a.favorite_count;
            const ints = (a.adoption_interests as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <li key={a.id} className="flex flex-col gap-4 rounded-3xl bg-white p-4 ring-1 ring-border/60 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
                    {img ? <Image src={storageUrl(img.storage_path, { thumb: true })!} alt="" fill sizes="80px" className="object-cover" /> : <AnimalIllustration species={a.species} seed={a.name} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/animais/${a.slug}`} className="font-display text-lg font-semibold text-sage-900 hover:underline">{a.name}</Link>
                      <Badge variant={a.status === "disponivel" ? "success" : a.status === "adotado" ? "dark" : a.moderation_locked ? "danger" : "warning"}>{STATUS_LABEL[a.status]}</Badge>
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="size-3.5" />{a.view_count}</span>
                      <span className="flex items-center gap-1"><Heart className="size-3.5" />{favs}</span>
                      <span className="flex items-center gap-1"><Inbox className="size-3.5" />{ints} interesses</span>
                      <span>Publicado em {formatDate(a.published_at)}</span>
                    </p>
                    {a.moderation_locked && a.status_reason && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-destructive"><TriangleAlert className="size-4" /> {a.status_reason}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AnimalStatusControl id={a.id} name={a.name} status={a.status} locked={a.moderation_locked} />
                  {!a.moderation_locked && (
                    <Button asChild variant="outline" size="sm"><Link href={`/painel/anuncios/${a.id}/editar`}><Pencil /> Editar</Link></Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
