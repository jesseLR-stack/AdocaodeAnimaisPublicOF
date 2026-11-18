import { SUPABASE_URL } from "@/lib/env";

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

export const formatDate = (d: string | Date) => dateFmt.format(new Date(d));
export const formatDateTime = (d: string | Date) => dateTimeFmt.format(new Date(d));
export const formatTime = (d: string | Date) => timeFmt.format(new Date(d));

export function timeAgo(d: string | Date) {
  const diff = (new Date(d).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "agora mesmo";
}

export function formatAge(months: number | null | undefined) {
  if (months == null) return null;
  if (months < 12) return `${months} ${months === 1 ? "mês" : "meses"}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "ano" : "anos"}`;
}

/** URL pública de uma imagem do Storage. `thumb` usa a versão reduzida gerada no upload. */
export function storageUrl(path: string | null | undefined, opts: { thumb?: boolean; bucket?: string } = {}) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  const bucket = opts.bucket ?? "animal-images";
  const finalPath = opts.thumb && bucket === "animal-images" ? thumbPath(path) : path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${finalPath}`;
}

export function thumbPath(path: string) {
  return path.replace(/\.(webp|jpe?g|png)$/i, "") + "-thumb.webp";
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Normaliza celular brasileiro para o formato internacional usado pelo WhatsApp. */
export function toWhatsappNumber(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function formatPhone(digits: string) {
  const d = onlyDigits(digits).replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}
