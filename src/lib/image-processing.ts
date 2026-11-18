"use client";

import imageCompression from "browser-image-compression";

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_INPUT_MB = 15;

async function dimensions(file: Blob) {
  const bitmap = await createImageBitmap(file);
  const d = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return d;
}

/** Gera a foto principal (até 1600px) e a miniatura (até 640px) em WebP. */
export async function processImage(file: File) {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  if (file.size > MAX_INPUT_MB * 1024 * 1024) throw new Error(`A imagem deve ter no máximo ${MAX_INPUT_MB} MB.`);
  const base = { fileType: "image/webp", useWebWorker: true, initialQuality: 0.82 } as const;
  const [full, thumb] = await Promise.all([
    imageCompression(file, { ...base, maxWidthOrHeight: 1600, maxSizeMB: 1.2 }),
    imageCompression(file, { ...base, maxWidthOrHeight: 640, maxSizeMB: 0.25 }),
  ]);
  return { full, thumb, ...(await dimensions(full)) };
}
