import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AnimalForm, type AnimalFormValues } from "@/components/animal-form/animal-form";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormAlert } from "@/components/forms/form-alert";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Editar anúncio" };

export default async function EditarAnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/painel/anuncios/${id}/editar`);
  const supabase = await createClient();
  const [{ data: a }, { data: contact }] = await Promise.all([
    supabase.from("animals").select("*, animal_images(id, storage_path, position, is_primary, width, height)").eq("id", id).eq("owner_id", user.id).maybeSingle(),
    supabase.from("animal_contacts").select("whatsapp").eq("animal_id", id).maybeSingle(),
  ]);
  if (!a) notFound();
  const images = [...a.animal_images].sort((x, y) => x.position - y.position);
  const initial: AnimalFormValues = {
    id: a.id,
    uf: a.uf,
    basic: { name: a.name, species: a.species, species_other: a.species_other ?? "", breed: a.breed ?? "", age_group: a.age_group, age_months: a.age_months, sex: a.sex, size: a.size },
    details: {
      description: a.description, story: a.story ?? "", personality: a.personality ?? "",
      temperament: a.temperament, good_with: a.good_with,
      vaccinated: a.vaccinated, neutered: a.neutered, dewormed: a.dewormed, vet_info: a.vet_info ?? "",
      special_needs: a.special_needs, special_needs_details: a.special_needs_details ?? "",
    },
    photos: {
      images: images.map((i) => ({ id: i.id, path: i.storage_path, width: i.width, height: i.height })),
      primary: images.find((i) => i.is_primary)?.storage_path ?? images[0]?.storage_path ?? null,
    },
    location: { city_id: a.city_id, region: a.region ?? "" },
    contact: { contact_preference: a.contact_preference, whatsapp: contact?.whatsapp ? formatPhone(contact.whatsapp) : "", accepts_messages: a.accepts_messages },
  };
  return (
    <>
      <DashHeader title={`Editar ${a.name}`} description="As alterações aparecem imediatamente no anúncio." />
      {a.moderation_locked ? (
        <FormAlert>Este anúncio foi {a.status} pela moderação{a.status_reason ? `: ${a.status_reason}` : ""}. Ele não pode ser editado. Se acredita que houve um engano, entre em contato.</FormAlert>
      ) : (
        <AnimalForm userId={user.id} initial={initial} mode="update" />
      )}
    </>
  );
}
