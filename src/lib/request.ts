import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** Hash do IP do cliente (não armazenamos o IP em claro). */
export async function clientIpHash() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "desconhecido";
  const salt = process.env.IP_HASH_SALT ?? "adoteamigo";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
