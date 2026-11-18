import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader, EmptyState } from "@/components/dashboard/dash-header";
import { InterestCard } from "@/components/dashboard/interest-card";
import { MarkInterestsSeen, ReceivedInterestActions } from "@/components/dashboard/interest-actions";
import { FormAlert } from "@/components/forms/form-alert";

export const metadata: Metadata = { title: "Interesses recebidos" };

export default async function RecebidosPage() {
  const user = await requireUser("/painel/interesses/recebidos");
  const supabase = await createClient();
  const { data } = await supabase
    .from("adoption_interests")
    .select("id, status, message, housing_info, owner_note, created_at, conversation_id, animals(name, slug, species, animal_images(storage_path, is_primary)), interested:profiles!adoption_interests_interested_id_fkey(full_name)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });
  const list = data ?? [];
  const unseen = list.filter((i) => i.status === "enviado").map((i) => i.id);

  return (
    <>
      <DashHeader title="Interesses recebidos" description="Pessoas que querem adotar os animais que você anunciou." />
      <FormAlert type="info" className="mb-5">
        Aceitar um interesse apenas indica que você quer conversar. A adoção só acontece depois que vocês combinarem
        tudo com calma — de preferência com um encontro presencial.
      </FormAlert>
      <MarkInterestsSeen ids={unseen} />
      {list.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Nenhum interesse ainda" description="Quando alguém demonstrar interesse em um dos seus anúncios, ele aparecerá aqui." />
      ) : (
        <ul className="space-y-3">
          {list.map((i) => {
            const a = i.animals as unknown as { name: string; slug: string; species: "cachorro" | "gato" | "outro"; animal_images: { storage_path: string; is_primary: boolean }[] } | null;
            const p = i.interested as unknown as { full_name: string } | null;
            return (
              <InterestCard
                key={i.id}
                animal={a ? { ...a, image: (a.animal_images.find((x) => x.is_primary) ?? a.animal_images[0])?.storage_path ?? null } : null}
                person={{ label: "Interessado(a)", name: p?.full_name ?? "Usuário" }}
                status={i.status}
                message={i.message}
                housing={i.housing_info}
                createdAt={i.created_at}
                actions={<ReceivedInterestActions id={i.id} status={i.status} conversationId={i.conversation_id} />}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
