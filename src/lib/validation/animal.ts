import { z } from "zod";
import { GOOD_WITH_OPTIONS, MAX_IMAGES, TEMPERAMENT_OPTIONS } from "@/lib/constants";

const health = z.enum(["sim", "nao", "parcial", "nao_informado"]);
const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo de ${max} caracteres.`).optional().transform((v) => (v ? v : null));

export const imageSchema = z.object({
  id: z.uuid().optional(),
  path: z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[\w-]+\.webp$/, "Imagem inválida."),
  width: z.number().int().positive().max(10000).nullable().optional(),
  height: z.number().int().positive().max(10000).nullable().optional(),
});

export const stepSchemas = {
  basic: z.object({
    name: z.string().trim().min(1, "Informe o nome do animal.").max(60),
    species: z.enum(["cachorro", "gato", "outro"], { error: "Escolha a espécie." }),
    species_other: optionalText(40),
    breed: optionalText(60),
    age_group: z.enum(["filhote", "jovem", "adulto", "idoso"], { error: "Escolha a faixa de idade." }),
    age_months: z.number().int().min(0).max(360).nullable(),
    sex: z.enum(["macho", "femea"], { error: "Escolha o sexo." }),
    size: z.enum(["pequeno", "medio", "grande"], { error: "Escolha o porte." }),
  }).refine((d) => d.species !== "outro" || (d.species_other?.length ?? 0) >= 2, {
    path: ["species_other"], message: "Informe qual é o animal (ex.: coelho, calopsita).",
  }),
  details: z.object({
    description: z.string().trim().min(20, "Escreva pelo menos 20 caracteres.").max(3000),
    story: optionalText(3000),
    personality: optionalText(1500),
    temperament: z.array(z.enum(TEMPERAMENT_OPTIONS as [string, ...string[]])).max(10),
    good_with: z.array(z.enum(GOOD_WITH_OPTIONS as [string, ...string[]])).max(5),
    vaccinated: health,
    neutered: health,
    dewormed: health,
    vet_info: optionalText(1500),
    special_needs: z.boolean(),
    special_needs_details: optionalText(1500),
  }).refine((d) => !d.special_needs || (d.special_needs_details?.length ?? 0) >= 5, {
    path: ["special_needs_details"], message: "Descreva as necessidades especiais.",
  }),
  photos: z.object({
    images: z.array(imageSchema).max(MAX_IMAGES, `Máximo de ${MAX_IMAGES} fotos.`),
    primary: z.string().nullable(),
  }),
  location: z.object({
    city_id: z.number({ error: "Selecione a cidade." }).int().positive("Selecione a cidade."),
    region: optionalText(80),
  }),
  contact: z.object({
    contact_preference: z.enum(["chat", "whatsapp", "ambos"]),
    whatsapp: z.string().transform((v) => v.replace(/\D/g, "")).optional(),
    accepts_messages: z.boolean(),
  }).refine((d) => d.contact_preference === "chat" || /^\d{10,11}$/.test(d.whatsapp ?? ""), {
    path: ["whatsapp"], message: "Informe um WhatsApp válido com DDD.",
  }).refine((d) => d.contact_preference !== "chat" || d.accepts_messages, {
    path: ["accepts_messages"], message: "Ative o chat ou informe um WhatsApp para receber contatos.",
  }),
};

export const animalSchema = z.object({
  id: z.uuid(),
  basic: stepSchemas.basic,
  details: stepSchemas.details,
  photos: stepSchemas.photos,
  location: stepSchemas.location,
  contact: stepSchemas.contact,
  accept_guidelines: z.literal(true, { error: "É necessário aceitar as diretrizes." }),
});

export type AnimalFormInput = z.input<typeof animalSchema>;
