"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/account";
import type { FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { CityPicker } from "@/components/forms/city-picker";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";
import { PROFILE_TYPE_LABEL } from "@/lib/constants";
import { formatPhone } from "@/lib/format";

type Props = {
  profile: { full_name: string; bio: string | null; profile_type: keyof typeof PROFILE_TYPE_LABEL; city_id: number | null; uf: string | null };
  phone: string | null;
  org: { name: string; description: string | null; website: string | null; instagram: string | null; cnpj: string | null } | null;
};

export function ProfileForm({ profile, phone, org }: Props) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  const [type, setType] = useState(profile.profile_type);
  const fe = state.fieldErrors ?? {};
  useEffect(() => { if (state.ok) toast.success(state.message); }, [state]);
  const isOrg = type === "ong_abrigo" || type === "organizacao_parceira";

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="full_name" error={fe.full_name} required>
          <Input id="full_name" name="full_name" defaultValue={profile.full_name} maxLength={80} />
        </Field>
        <Field label="Tipo de perfil" htmlFor="profile_type" hint="Alterar o tipo não concede verificação automática.">
          <NativeSelect id="profile_type" name="profile_type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            {Object.entries(PROFILE_TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Sobre você" htmlFor="bio" hint="Aparece no seu perfil público (até 600 caracteres).">
        <Textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} maxLength={600} />
      </Field>
      <CityPicker required defaultUf={profile.uf ?? ""} defaultCityId={profile.city_id} error={fe.city_id?.[0]} />
      <Field label="Telefone (privado)" htmlFor="phone" error={fe.phone} hint="Nunca é exibido publicamente.">
        <Input id="phone" name="phone" type="tel" defaultValue={phone ? formatPhone(phone) : ""} placeholder="(11) 91234-5678" />
      </Field>
      {isOrg && (
        <fieldset className="space-y-5 rounded-2xl bg-cream-100 p-5">
          <legend className="sr-only">Dados da organização</legend>
          <p className="font-semibold text-sage-900">Dados da organização</p>
          <Field label="Nome da organização" htmlFor="org_name"><Input id="org_name" name="org_name" defaultValue={org?.name ?? ""} maxLength={120} /></Field>
          <Field label="Descrição" htmlFor="org_description"><Textarea id="org_description" name="org_description" rows={3} defaultValue={org?.description ?? ""} maxLength={2000} /></Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Site" htmlFor="org_website" error={fe.org_website}><Input id="org_website" name="org_website" type="url" defaultValue={org?.website ?? ""} placeholder="https://" /></Field>
            <Field label="Instagram" htmlFor="org_instagram" error={fe.org_instagram}><Input id="org_instagram" name="org_instagram" defaultValue={org?.instagram ?? ""} placeholder="@suaong" /></Field>
            <Field label="CNPJ (opcional)" htmlFor="org_cnpj" error={fe.org_cnpj}><Input id="org_cnpj" name="org_cnpj" inputMode="numeric" defaultValue={org?.cnpj ?? ""} /></Field>
          </div>
        </fieldset>
      )}
      <SubmitButton size="lg" pendingText="Salvando…">Salvar perfil</SubmitButton>
    </form>
  );
}
