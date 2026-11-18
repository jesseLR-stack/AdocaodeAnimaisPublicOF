"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  ArrowLeft, ArrowRight, Camera, Cat, Check, Dog, ImagePlus, Loader2, Rabbit, Star, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { saveAnimal } from "@/app/actions/animals";
import { createClient } from "@/lib/supabase/client";
import { processImage } from "@/lib/image-processing";
import { stepSchemas, type AnimalFormInput } from "@/lib/validation/animal";
import {
  AGE_HINT, AGE_LABEL, CONTACT_PREF_LABEL, GOOD_WITH_OPTIONS, HEALTH_LABEL, MAX_IMAGES, SEX_LABEL, SIZE_LABEL,
  SPECIES_LABEL, TEMPERAMENT_OPTIONS,
} from "@/lib/constants";
import { storageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { CityPicker } from "@/components/forms/city-picker";
import { FormAlert } from "@/components/forms/form-alert";
import { AnimalIllustration } from "@/components/brand/animal-illustration";

type Img = { id?: string; path: string; width?: number | null; height?: number | null; preview?: string };
export type AnimalFormValues = Omit<AnimalFormInput, "photos" | "accept_guidelines"> & {
  photos: { images: Img[]; primary: string | null };
  uf: string;
};

const STEPS = [
  { key: "basic", title: "Informações básicas", short: "Básico" },
  { key: "details", title: "Características e saúde", short: "Detalhes" },
  { key: "photos", title: "Fotografias", short: "Fotos" },
  { key: "location", title: "Localização", short: "Local" },
  { key: "contact", title: "Contato", short: "Contato" },
  { key: "review", title: "Revisão e publicação", short: "Revisão" },
] as const;

function Choice<T extends string>({
  value, current, onSelect, children, className,
}: { value: T; current: T | undefined; onSelect: (v: T) => void; children: React.ReactNode; className?: string }) {
  const active = current === value;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(value)}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition active:scale-[0.98]",
        active ? "border-sage-500 bg-sage-50 text-sage-900 ring-4 ring-sage-100" : "border-input bg-white text-sage-700 hover:border-sage-300",
        className,
      )}
    >
      {children}
    </button>
  );
}

function Tags({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? value.filter((v) => v !== o) : value.length < max ? [...value, o] : value)}
            className={cn(
              "cursor-pointer rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition",
              active ? "border-apricot-400 bg-apricot-100 text-apricot-600" : "border-input bg-white text-sage-700 hover:border-sage-300",
            )}
          >
            {active && <Check className="mr-1 inline size-3.5" />}{o}
          </button>
        );
      })}
    </div>
  );
}

export function AnimalForm({ userId, initial, mode }: { userId: string; initial: AnimalFormValues; mode: "create" | "update" }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<AnimalFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accept, setAccept] = useState(mode === "update");
  const [uploading, setUploading] = useState(0);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const initialMonths = initial.basic.age_months;
  const [ageUnit, setAgeUnit] = useState<"meses" | "anos">(initialMonths != null && initialMonths < 12 ? "meses" : "anos");
  const [ageAmount, setAgeAmount] = useState(
    initialMonths == null ? "" : String(initialMonths < 12 ? initialMonths : Math.floor(initialMonths / 12)),
  );
  function updateAge(amount: string, unit: "meses" | "anos") {
    setAgeAmount(amount);
    setAgeUnit(unit);
    const n = amount === "" ? null : Math.max(0, Math.floor(Number(amount)));
    set("basic", { age_months: n == null || Number.isNaN(n) ? null : unit === "anos" ? Math.min(n * 12, 360) : Math.min(n, 11) });
  }
  const topRef = useRef<HTMLDivElement>(null);

  const set = <K extends keyof AnimalFormValues>(group: K, patch: Partial<AnimalFormValues[K]>) =>
    setValues((v) => ({ ...v, [group]: { ...(v[group] as object), ...patch } }));
  const err = (k: string) => errors[k];

  function validate(index: number) {
    const key = STEPS[index]!.key;
    if (key === "review") return true;
    const schema = stepSchemas[key];
    const result = schema.safeParse(values[key]);
    if (result.success) {
      setErrors({});
      return true;
    }
    const e: Record<string, string> = {};
    for (const issue of result.error.issues) e[`${key}.${issue.path.join(".")}`] ??= issue.message;
    setErrors(e);
    toast.error("Revise os campos destacados.");
    return false;
  }

  function goTo(index: number) {
    if (index > step) {
      for (let i = step; i < index; i++) if (!validate(i)) return setStep(i);
    }
    setStep(index);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_IMAGES - values.photos.images.length;
    const list = Array.from(files).slice(0, room);
    if (files.length > room) toast.warning(`Você pode enviar no máximo ${MAX_IMAGES} fotos.`);
    const supabase = createClient();
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const { full, thumb, width, height } = await processImage(file);
        const name = crypto.randomUUID();
        const path = `${userId}/${values.id}/${name}.webp`;
        const opts = { contentType: "image/webp", upsert: false };
        const [a, b] = await Promise.all([
          supabase.storage.from("animal-images").upload(path, full, opts),
          supabase.storage.from("animal-images").upload(path.replace(/\.webp$/, "-thumb.webp"), thumb, opts),
        ]);
        if (a.error || b.error) throw new Error("Falha no envio. Verifique sua conexão.");
        const preview = URL.createObjectURL(thumb);
        setValues((v) => ({
          ...v,
          photos: {
            images: [...v.photos.images, { path, width, height, preview }],
            primary: v.photos.primary ?? path,
          },
        }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Não foi possível processar a imagem.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function removeImage(path: string) {
    setValues((v) => {
      const images = v.photos.images.filter((i) => i.path !== path);
      return { ...v, photos: { images, primary: v.photos.primary === path ? images[0]?.path ?? null : v.photos.primary } };
    });
  }

  function submit() {
    if (!accept) return toast.error("Aceite as diretrizes para publicar.");
    for (let i = 0; i < STEPS.length - 1; i++) if (!validate(i)) return setStep(i);
    start(async () => {
      const { uf: _uf, ...rest } = values;
      const payload = {
        ...rest,
        photos: { primary: values.photos.primary, images: values.photos.images.map(({ id, path, width, height }) => ({ id, path, width, height })) },
        accept_guidelines: true as const,
      };
      const res = await saveAnimal(payload, mode);
      if (!res.ok) {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Anúncio publicado! 🎉" : "Anúncio atualizado!");
      router.push(`/animais/${res.slug}`);
      router.refresh();
    });
  }

  const b = values.basic;
  const d = values.details;
  const c = values.contact;
  const current = STEPS[step]!;
  const primaryImg = values.photos.images.find((i) => i.path === values.photos.primary) ?? values.photos.images[0];

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Indicador de etapas */}
      <ol className="mb-6 grid grid-cols-6 gap-1.5" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={i === step ? "step" : undefined}
              className="group flex w-full cursor-pointer flex-col gap-1.5 text-left"
            >
              <span className={cn("h-1.5 rounded-full transition", i < step ? "bg-sage-500" : i === step ? "bg-apricot-400" : "bg-beige-300")} />
              <span className={cn("hidden text-xs font-semibold sm:block", i === step ? "text-sage-900" : "text-muted-foreground")}>
                {i + 1}. {s.short}
              </span>
            </button>
          </li>
        ))}
      </ol>

      <div className="rounded-[2rem] bg-white p-5 shadow-soft ring-1 ring-border/60 sm:p-8">
        <p className="text-sm font-semibold text-apricot-500">Etapa {step + 1} de {STEPS.length}</p>
        <h2 className="mt-1 text-2xl font-semibold text-sage-900">{current.title}</h2>

        <div className="mt-6 space-y-6">
          {current.key === "basic" && (
            <>
              <Field label="Nome do animal" htmlFor="name" error={err("basic.name")} required>
                <Input id="name" value={b.name} onChange={(e) => set("basic", { name: e.target.value })} maxLength={60} placeholder="Ex.: Bolinha" />
              </Field>
              <div role="radiogroup" aria-label="Espécie">
                <p className="mb-2 text-sm font-semibold text-sage-900">Espécie <span className="text-apricot-500">*</span></p>
                <div className="grid grid-cols-3 gap-2">
                  <Choice value="cachorro" current={b.species} onSelect={(v) => set("basic", { species: v })}><Dog className="size-5" /> Cachorro</Choice>
                  <Choice value="gato" current={b.species} onSelect={(v) => set("basic", { species: v })}><Cat className="size-5" /> Gato</Choice>
                  <Choice value="outro" current={b.species} onSelect={(v) => set("basic", { species: v })}><Rabbit className="size-5" /> Outro</Choice>
                </div>
                {err("basic.species") && <p className="mt-2 text-sm text-destructive">{err("basic.species")}</p>}
              </div>
              {b.species === "outro" && (
                <Field label="Qual animal?" htmlFor="species_other" error={err("basic.species_other")} required hint="Animais silvestres exigem autorização do órgão ambiental.">
                  <Input id="species_other" value={b.species_other ?? ""} onChange={(e) => set("basic", { species_other: e.target.value })} placeholder="Ex.: coelho, calopsita, porquinho-da-índia" />
                </Field>
              )}
              <Field label="Raça" htmlFor="breed" hint="Deixe em branco se não souber (sem raça definida).">
                <Input id="breed" value={b.breed ?? ""} onChange={(e) => set("basic", { breed: e.target.value })} maxLength={60} />
              </Field>
              <div role="radiogroup" aria-label="Idade">
                <p className="mb-2 text-sm font-semibold text-sage-900">Faixa de idade <span className="text-apricot-500">*</span></p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(AGE_LABEL) as (keyof typeof AGE_LABEL)[]).map((k) => (
                    <Choice key={k} value={k} current={b.age_group} onSelect={(v) => set("basic", { age_group: v })} className="flex-col gap-0">
                      {AGE_LABEL[k]}<span className="text-xs font-medium text-muted-foreground">{AGE_HINT[k]}</span>
                    </Choice>
                  ))}
                </div>
                {err("basic.age_group") && <p className="mt-2 text-sm text-destructive">{err("basic.age_group")}</p>}
              </div>
              <Field label="Idade aproximada (opcional)" htmlFor="age" hint="Use meses para filhotes e anos para adultos.">
                <div className="flex gap-2">
                  <Input
                    id="age" type="number" min={0} max={ageUnit === "anos" ? 30 : 11} inputMode="numeric" className="w-28"
                    value={ageAmount}
                    onChange={(e) => updateAge(e.target.value, ageUnit)}
                  />
                  <NativeSelect id="age-unit" className="w-32" value={ageUnit} onChange={(e) => updateAge(ageAmount, e.target.value as "meses" | "anos")}>
                    <option value="meses">meses</option>
                    <option value="anos">anos</option>
                  </NativeSelect>
                </div>
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <div role="radiogroup" aria-label="Sexo">
                  <p className="mb-2 text-sm font-semibold text-sage-900">Sexo <span className="text-apricot-500">*</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SEX_LABEL) as (keyof typeof SEX_LABEL)[]).map((k) => (
                      <Choice key={k} value={k} current={b.sex} onSelect={(v) => set("basic", { sex: v })}>{SEX_LABEL[k]}</Choice>
                    ))}
                  </div>
                  {err("basic.sex") && <p className="mt-2 text-sm text-destructive">{err("basic.sex")}</p>}
                </div>
                <div role="radiogroup" aria-label="Porte">
                  <p className="mb-2 text-sm font-semibold text-sage-900">Porte <span className="text-apricot-500">*</span></p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(SIZE_LABEL) as (keyof typeof SIZE_LABEL)[]).map((k) => (
                      <Choice key={k} value={k} current={b.size} onSelect={(v) => set("basic", { size: v })} className="px-2">{SIZE_LABEL[k]}</Choice>
                    ))}
                  </div>
                  {err("basic.size") && <p className="mt-2 text-sm text-destructive">{err("basic.size")}</p>}
                </div>
              </div>
            </>
          )}

          {current.key === "details" && (
            <>
              <Field label="Descrição" htmlFor="description" error={err("details.description")} required hint={`${d.description.length}/3000 — mínimo de 20 caracteres.`}>
                <Textarea id="description" rows={5} value={d.description} onChange={(e) => set("details", { description: e.target.value })} maxLength={3000}
                  placeholder="Como ele(a) é? Do que gosta? Que tipo de lar seria ideal?" />
              </Field>
              <div>
                <p className="mb-2 text-sm font-semibold text-sage-900">Temperamento</p>
                <Tags options={TEMPERAMENT_OPTIONS} value={d.temperament} onChange={(v) => set("details", { temperament: v })} max={10} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-sage-900">Convive bem com</p>
                <Tags options={GOOD_WITH_OPTIONS} value={d.good_with} onChange={(v) => set("details", { good_with: v })} max={5} />
              </div>
              <Field label="Personalidade (opcional)" htmlFor="personality" error={err("details.personality")}>
                <Textarea id="personality" rows={3} value={d.personality ?? ""} onChange={(e) => set("details", { personality: e.target.value })} maxLength={1500} />
              </Field>
              <Field label="História (opcional)" htmlFor="story" error={err("details.story")} hint="Como foi resgatado(a)? Por que está para adoção?">
                <Textarea id="story" rows={3} value={d.story ?? ""} onChange={(e) => set("details", { story: e.target.value })} maxLength={3000} />
              </Field>
              <div className="rounded-2xl bg-cream-100 p-4 sm:p-5">
                <p className="font-semibold text-sage-900">Informações veterinárias</p>
                <p className="text-sm text-muted-foreground">Serão exibidas como <strong>declaradas pelo anunciante</strong>, sem verificação.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {(["vaccinated", "neutered", "dewormed"] as const).map((k) => (
                    <Field key={k} label={{ vaccinated: "Vacinado", neutered: "Castrado", dewormed: "Vermifugado" }[k]} htmlFor={k}>
                      <NativeSelect id={k} value={d[k]} onChange={(e) => set("details", { [k]: e.target.value } as never)}>
                        {(Object.keys(HEALTH_LABEL) as (keyof typeof HEALTH_LABEL)[]).map((h) => <option key={h} value={h}>{HEALTH_LABEL[h]}</option>)}
                      </NativeSelect>
                    </Field>
                  ))}
                </div>
                <Field label="Observações veterinárias (opcional)" htmlFor="vet_info" className="mt-4">
                  <Textarea id="vet_info" rows={2} value={d.vet_info ?? ""} onChange={(e) => set("details", { vet_info: e.target.value })} maxLength={1500}
                    placeholder="Vacinas aplicadas, exames, medicações…" />
                </Field>
              </div>
              <div className="rounded-2xl border-2 border-input p-4 sm:p-5">
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block font-semibold text-sage-900">Possui necessidades especiais?</span>
                    <span className="text-sm text-muted-foreground">Deficiência, doença crônica, medicação contínua…</span>
                  </span>
                  <Switch checked={d.special_needs} onCheckedChange={(v) => set("details", { special_needs: v })} aria-label="Necessidades especiais" />
                </label>
                {d.special_needs && (
                  <Field label="Descreva os cuidados necessários" htmlFor="special_needs_details" error={err("details.special_needs_details")} className="mt-4" required>
                    <Textarea id="special_needs_details" rows={3} value={d.special_needs_details ?? ""} onChange={(e) => set("details", { special_needs_details: e.target.value })} maxLength={1500} />
                  </Field>
                )}
              </div>
            </>
          )}

          {current.key === "photos" && (
            <>
              <p className="text-sm text-muted-foreground">
                Envie até {MAX_IMAGES} fotos (JPG, PNG ou WebP). Elas são comprimidas automaticamente. Toque na ⭐ para
                escolher a foto principal. Anúncios com fotos recebem muito mais interesse!
              </p>
              <input
                ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/heic" multiple hidden
                onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {values.photos.images.map((img) => {
                  const isPrimary = (values.photos.primary ?? values.photos.images[0]?.path) === img.path;
                  return (
                    <div key={img.path} className={cn("group relative aspect-square overflow-hidden rounded-2xl bg-cream-200 ring-2", isPrimary ? "ring-apricot-400" : "ring-transparent")}>
                      <Image src={img.preview ?? storageUrl(img.path, { thumb: true })!} alt="" fill sizes="200px" className="object-cover" unoptimized />
                      {isPrimary && <span className="absolute bottom-2 left-2 rounded-full bg-apricot-400 px-2 py-0.5 text-[11px] font-bold text-white">Principal</span>}
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        <button type="button" onClick={() => set("photos", { primary: img.path })} aria-label="Definir como foto principal"
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-soft transition hover:scale-105">
                          <Star className={cn("size-4", isPrimary ? "fill-apricot-400 text-apricot-400" : "text-sage-700")} />
                        </button>
                        <button type="button" onClick={() => removeImage(img.path)} aria-label="Remover foto"
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-white/90 text-destructive shadow-soft transition hover:scale-105">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {Array.from({ length: uploading }).map((_, i) => (
                  <div key={`up-${i}`} className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-cream-100 text-sm text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-sage-500" /> Enviando…
                  </div>
                ))}
                {values.photos.images.length + uploading < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-sage-300 bg-sage-50 text-sm font-semibold text-sage-700 transition hover:border-sage-500 hover:bg-sage-100"
                  >
                    <ImagePlus className="size-7" /> Adicionar fotos
                  </button>
                )}
              </div>
              {values.photos.images.length === 0 && (
                <FormAlert type="info">As fotos não são obrigatórias, mas sem elas o anúncio mostra uma ilustração no lugar.</FormAlert>
              )}
            </>
          )}

          {current.key === "location" && (
            <>
              <CityPicker
                required
                defaultUf={values.uf}
                defaultCityId={values.location.city_id || null}
                error={err("location.city_id")}
                onChange={({ uf, cityId }) => setValues((v) => ({ ...v, uf, location: { ...v.location, city_id: cityId ?? 0 } }))}
              />
              <Field label="Bairro ou região aproximada (opcional)" htmlFor="region" hint="Não informe endereço completo por segurança." error={err("location.region")}>
                <Input id="region" value={values.location.region ?? ""} onChange={(e) => set("location", { region: e.target.value })} maxLength={80} placeholder="Ex.: Zona Sul, Centro" />
              </Field>
            </>
          )}

          {current.key === "contact" && (
            <>
              <div role="radiogroup" aria-label="Preferência de contato">
                <p className="mb-2 text-sm font-semibold text-sage-900">Como prefere ser contatado(a)?</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {(Object.keys(CONTACT_PREF_LABEL) as (keyof typeof CONTACT_PREF_LABEL)[]).map((k) => (
                    <Choice key={k} value={k} current={c.contact_preference} onSelect={(v) => set("contact", { contact_preference: v })}>{CONTACT_PREF_LABEL[k]}</Choice>
                  ))}
                </div>
              </div>
              {c.contact_preference !== "chat" && (
                <Field label="WhatsApp" htmlFor="whatsapp" error={err("contact.whatsapp")} required
                  hint="Só aparece para usuários logados, por meio do botão do WhatsApp. Você pode removê-lo a qualquer momento.">
                  <Input id="whatsapp" type="tel" inputMode="tel" value={c.whatsapp ?? ""} onChange={(e) => set("contact", { whatsapp: e.target.value })} placeholder="(11) 91234-5678" />
                </Field>
              )}
              <label className="flex items-center justify-between gap-4 rounded-2xl border-2 border-input p-4">
                <span>
                  <span className="block font-semibold text-sage-900">Receber mensagens pelo chat do AdoteAmigo</span>
                  <span className="text-sm text-muted-foreground">Conversas seguras, sem expor seu telefone.</span>
                </span>
                <Switch checked={c.accepts_messages} onCheckedChange={(v) => set("contact", { accepts_messages: v })} aria-label="Receber mensagens" />
              </label>
              {err("contact.accepts_messages") && <p className="text-sm text-destructive">{err("contact.accepts_messages")}</p>}
            </>
          )}

          {current.key === "review" && (
            <>
              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-200">
                  {primaryImg ? (
                    <Image src={primaryImg.preview ?? storageUrl(primaryImg.path, { thumb: true })!} alt="" fill sizes="180px" className="object-cover" unoptimized />
                  ) : (
                    <AnimalIllustration species={b.species ?? "cachorro"} seed={b.name} />
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {[
                    ["Nome", b.name], ["Espécie", b.species === "outro" ? b.species_other : b.species && SPECIES_LABEL[b.species]],
                    ["Raça", b.breed || "Sem raça definida"], ["Idade", b.age_group && AGE_LABEL[b.age_group]],
                    ["Sexo", b.sex && SEX_LABEL[b.sex]], ["Porte", b.size && SIZE_LABEL[b.size]],
                    ["Vacinado", HEALTH_LABEL[d.vaccinated]], ["Castrado", HEALTH_LABEL[d.neutered]],
                    ["Fotos", values.photos.images.length], ["Contato", CONTACT_PREF_LABEL[c.contact_preference]],
                  ].map(([k, v]) => (
                    <div key={String(k)}>
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-semibold text-sage-900">{v ?? "—"}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="line-clamp-4 rounded-2xl bg-cream-100 p-4 text-sage-800">{d.description}</p>
              <div className="flex flex-wrap gap-2">
                {STEPS.slice(0, 5).map((s, i) => (
                  <Button key={s.key} type="button" variant="ghost" size="sm" onClick={() => goTo(i)}>Editar {s.short.toLowerCase()}</Button>
                ))}
              </div>
              <label className="flex items-start gap-3 rounded-2xl bg-apricot-100 p-4 text-sm text-sage-900">
                <Checkbox checked={accept} onCheckedChange={(v) => setAccept(v === true)} className="mt-0.5" />
                <span>
                  Declaro que as informações são verdadeiras, que o animal será doado <strong>gratuitamente</strong> e que
                  concordo com as <Link href="/diretrizes" target="_blank" className="font-semibold underline">Diretrizes da Comunidade</Link>.
                </span>
              </label>
            </>
          )}
        </div>
      </div>

      <div className="sticky bottom-20 z-10 mt-5 flex items-center justify-between gap-3 rounded-full bg-white/90 p-2 shadow-lift ring-1 ring-border/60 backdrop-blur md:bottom-4">
        <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0 || pending}>
          <ArrowLeft /> Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => goTo(step + 1)} disabled={uploading > 0}>
            {step === 2 && uploading > 0 ? <><Loader2 className="animate-spin" /> Enviando fotos</> : <>Continuar <ArrowRight /></>}
          </Button>
        ) : (
          <Button type="button" variant="accent" onClick={submit} disabled={pending || !accept || uploading > 0}>
            {pending ? <Loader2 className="animate-spin" /> : <Camera />} {mode === "create" ? "Publicar anúncio" : "Salvar alterações"}
          </Button>
        )}
      </div>
    </div>
  );
}
