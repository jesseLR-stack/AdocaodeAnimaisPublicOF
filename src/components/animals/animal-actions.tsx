"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HandHeart, Loader2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { registerInterest, revealWhatsapp, startConversation } from "@/app/actions/animal-contact";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FavoriteButton } from "./favorite-button";
import { ReportDialog } from "./report-dialog";

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm8.4-18.2A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.6A11.8 11.8 0 0 0 23.8 12c0-3.2-1.2-6.1-3.4-8.4Z" />
    </svg>
  );
}

export function AnimalActions({
  animal, isLoggedIn, alreadyInterested, isFavorite,
}: {
  animal: { id: string; name: string; slug: string; acceptsMessages: boolean; whatsappEnabled: boolean; status: string };
  isLoggedIn: boolean;
  alreadyInterested: boolean;
  isFavorite: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`Olá! Tenho interesse em adotar ${animal.name}. `);
  const [housing, setHousing] = useState("");
  const [interested, setInterested] = useState(alreadyInterested);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<"chat" | "whats" | null>(null);
  const available = animal.status === "disponivel";

  const requireLogin = () => {
    toast("Entre na sua conta para continuar", {
      action: { label: "Entrar", onClick: () => router.push(`/entrar?redirect=${encodeURIComponent(pathname)}`) },
    });
  };

  function sendInterest() {
    start(async () => {
      const res = await registerInterest({ animalId: animal.id, message, housing });
      if (!res.ok) {
        if (res.login) requireLogin();
        else toast.error(res.error);
        return;
      }
      setInterested(true);
      setOpen(false);
      toast.success("Interesse enviado!", {
        description: "O anunciante foi notificado. Acompanhe em Painel → Interesses enviados.",
      });
    });
  }

  async function chat() {
    if (!isLoggedIn) return requireLogin();
    setBusy("chat");
    const res = await startConversation(animal.id);
    // Em caso de sucesso a action redireciona; só voltamos aqui em caso de erro.
    if (res && !res.ok) toast.error(res.error);
    setBusy(null);
  }

  async function whatsapp() {
    if (!isLoggedIn) return requireLogin();
    setBusy("whats");
    // Abre a aba antes do await para não ser bloqueada pelo navegador.
    const win = window.open("", "_blank");
    const res = await revealWhatsapp(animal.id);
    setBusy(null);
    if (!res.ok) {
      win?.close();
      toast.error(res.error);
      return;
    }
    const url = `${window.location.origin}/animais/${animal.slug}`;
    const text = `Olá! Vi o anúncio de ${animal.name} no AdoteAmigo e tenho interesse em adotar. ${url}`;
    const wa = `https://wa.me/${res.data}?text=${encodeURIComponent(text)}`;
    if (win) win.location.href = wa;
    else window.location.href = wa;
  }

  async function share() {
    const url = `${window.location.origin}/animais/${animal.slug}`;
    const data = { title: `${animal.name} para adoção — AdoteAmigo`, text: `Conheça ${animal.name}, que está procurando um lar!`, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        /* usuário cancelou */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!", {
      action: { label: "Enviar no WhatsApp", onClick: () => window.open(`https://wa.me/?text=${encodeURIComponent(`${data.text} ${url}`)}`, "_blank") },
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {available && (
        interested ? (
          <div className="rounded-2xl bg-sage-50 p-4 text-sm text-sage-800 ring-1 ring-sage-200">
            <p className="font-semibold">Você já demonstrou interesse 💚</p>
            <p className="mt-0.5">Acompanhe em <a href="/painel/interesses/enviados" className="font-semibold underline">Interesses enviados</a>. Lembre-se: o interesse não garante a adoção.</p>
          </div>
        ) : (
          <Button size="lg" variant="accent" className="w-full" onClick={() => (isLoggedIn ? setOpen(true) : requireLogin())}>
            <HandHeart className="size-5" /> Tenho interesse em adotar
          </Button>
        )
      )}
      <div className="grid grid-cols-2 gap-2.5">
        {animal.acceptsMessages && (available || interested) && (
          <Button size="lg" variant="outline" onClick={chat} disabled={busy !== null} className={animal.whatsappEnabled && available ? "" : "col-span-2"}>
            {busy === "chat" ? <Loader2 className="animate-spin" /> : <MessageCircle className="size-5" />} Conversar
          </Button>
        )}
        {animal.whatsappEnabled && available && (
          <Button size="lg" onClick={whatsapp} disabled={busy !== null} className={`bg-[#1f8f4e] hover:bg-[#187a41] ${animal.acceptsMessages ? "" : "col-span-2"}`}>
            {busy === "whats" ? <Loader2 className="animate-spin" /> : <WhatsappIcon className="size-5" />} WhatsApp
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <FavoriteButton animalId={animal.id} initial={isFavorite} isLoggedIn={isLoggedIn} variant="full" />
        <Button size="lg" variant="outline" onClick={share}><Share2 className="size-5" /> Compartilhar</Button>
      </div>
      <div className="flex justify-center">
        <ReportDialog targetType="animal" targetId={animal.id} isLoggedIn={isLoggedIn} />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interesse em adotar {animal.name}</DialogTitle>
            <DialogDescription>
              Conte um pouco sobre você. Registrar interesse <strong>não significa</strong> que a adoção foi aprovada:
              o anunciante vai analisar e conversar com você.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Mensagem para o anunciante" htmlFor="int-msg" hint={`${message.length}/1500 caracteres`} required>
              <Textarea id="int-msg" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1500} />
            </Field>
            <Field label="Onde você mora? (opcional)" htmlFor="int-housing" hint="Ex.: apartamento com telas, casa com quintal…">
              <Input id="int-housing" value={housing} onChange={(e) => setHousing(e.target.value)} maxLength={500} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="accent" onClick={sendInterest} disabled={pending || message.trim().length < 10}>
              {pending && <Loader2 className="animate-spin" />} Enviar interesse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
