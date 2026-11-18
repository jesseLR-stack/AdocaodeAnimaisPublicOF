"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Compartilha a lista de favoritos disponíveis como texto com links (WhatsApp, redes, etc.). */
export function ShareFavorites({ slugs }: { slugs: { name: string; slug: string }[] }) {
  async function share() {
    if (slugs.length === 0) return toast("Nenhum favorito disponível para compartilhar.");
    const origin = window.location.origin;
    const text = `Meus favoritos no AdoteAmigo 🐾\n\n${slugs.map((s) => `• ${s.name}: ${origin}/animais/${s.slug}`).join("\n")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Meus favoritos no AdoteAmigo", text }); } catch { /* cancelado */ }
      return;
    }
    await navigator.clipboard.writeText(text);
    toast.success("Lista copiada!", {
      action: { label: "Enviar no WhatsApp", onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank") },
    });
  }
  return <Button variant="outline" onClick={share}><Share2 /> Compartilhar lista</Button>;
}
