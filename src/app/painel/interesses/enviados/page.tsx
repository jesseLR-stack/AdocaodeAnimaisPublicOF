import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, Send } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { InterestCard } from "@/components/dashboard/interest-card";
import { CancelInterestButton } from "@/components/dashboard/interest-actions";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Interesses enviados" };

export default async function EnviadosPage() {
  const user = await requireUser("/painel/interesses/enviados");
  const supabase = await createClient();
  const { data } = await supabase
    .from("adoption_interests")
    .select("id, status, message, housing_info, owner_note, created_at, conversation_id, animals(name, slug, species, status, animal_images(storage_path, is_primary)), owner:profiles!adoption_interests_owner_id_fkey(full_name)")
    .eq("interested_id", user.id)
    .order("created_at", { ascending: false });
  const list = data ?? [];

  return (
    <>
      <DashHeader title="Interesses enviados" description="Acompanhe o histórico das suas manifestações de interesse." />
      {list.length === 0 ? (
        <EmptyState icon={<Send />} title="Você ainda não demonstrou interesse" description="Encontre um animal e clique em “Tenho interesse em adotar”."
          action={<Button asChild><Link href="/animais">Ver animais</Link></Button>} />
      ) : (
        <ul className="space-y-3">
          {list.map((i) => {
            const a = i.animals as unknown as { name: string; slug: string; species: "cachorro" | "gato" | "outro"; status: string; animal_images: { storage_path: string; is_primary: boolean }[] } | null;
            const o = i.owner as unknown as { full_name: string } | null;
            return (
              <InterestCard
                key={i.id}
                animal={a ? { ...a, image: (a.animal_images.find((x) => x.is_primary) ?? a.animal_images[0])?.storage_path ?? null } : null}
                person={{ label: "Anunciante", name: o?.full_name ?? "Usuário" }}
                status={i.status}
                message={i.message}
                createdAt={i.created_at}
                ownerNote={i.owner_note}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {a?.status === "adotado" && <p className="text-sm font-semibold text-sage-700">Este animal já foi adotado.</p>}
                    {i.conversation_id && (
                      <Button asChild size="sm"><Link href={`/painel/conversas/${i.conversation_id}`}><MessageCircle /> Abrir conversa</Link></Button>
                    )}
                    {!["cancelado", "recusado"].includes(i.status) && <CancelInterestButton id={i.id} />}
                  </div>
                }
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
