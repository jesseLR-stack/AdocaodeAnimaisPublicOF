import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { AnimalForm, type AnimalFormValues } from "@/components/animal-form/animal-form";
import { DashHeader } from "@/components/dashboard/dash-header";
import { FormAlert } from "@/components/forms/form-alert";

export const metadata: Metadata = { title: "Criar anúncio" };

export default async function NovoAnuncioPage() {
  const user = await requireUser("/painel/anuncios/novo");
  const initial: AnimalFormValues = {
    id: crypto.randomUUID(),
    uf: user.profile.uf ?? "",
    basic: { name: "", species: undefined as never, species_other: "", breed: "", age_group: undefined as never, age_months: null, sex: undefined as never, size: undefined as never },
    details: {
      description: "", story: "", personality: "", temperament: [], good_with: [],
      vaccinated: "nao_informado", neutered: "nao_informado", dewormed: "nao_informado", vet_info: "",
      special_needs: false, special_needs_details: "",
    },
    photos: { images: [], primary: null },
    location: { city_id: user.profile.city_id ?? 0, region: "" },
    contact: { contact_preference: "chat", whatsapp: "", accepts_messages: true },
  };
  return (
    <>
      <DashHeader title="Anunciar um animal" description="Leva uns 5 minutos. A publicação é imediata após a revisão." />
      {user.profile.account_status !== "ativo" ? (
        <FormAlert>Sua conta não pode publicar anúncios no momento.</FormAlert>
      ) : (
        <AnimalForm userId={user.id} initial={initial} mode="create" />
      )}
    </>
  );
}
