"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { publishStory, setAnimalStatus } from "@/app/actions/animals";
import { NativeSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const OPTIONS = [
  { value: "disponivel", label: "Disponível" },
  { value: "pausado", label: "Pausado" },
  { value: "adotado", label: "Adotado 🎉" },
  { value: "removido", label: "Removido" },
];

export function AnimalStatusControl({ id, name, status, locked }: { id: string; name: string; status: string; locked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [storyOpen, setStoryOpen] = useState(false);
  const [title, setTitle] = useState(`${name} encontrou um lar!`);
  const [body, setBody] = useState("");

  if (locked) return <p className="text-xs font-semibold text-destructive">Bloqueado pela moderação</p>;

  function change(next: string) {
    if (next === status) return;
    if (next === "removido" && !confirm(`Remover o anúncio de ${name}? Ele deixará de aparecer no site.`)) return;
    start(async () => {
      const res = await setAnimalStatus(id, next);
      if (!res.ok) return void toast.error(res.error);
      toast.success(next === "adotado" ? `Que notícia boa! ${name} foi marcado(a) como adotado(a).` : "Status atualizado.");
      if (next === "adotado") setStoryOpen(true);
      router.refresh();
    });
  }

  function sendStory() {
    start(async () => {
      const res = await publishStory({ animalId: id, title, body });
      if (!res.ok) return void toast.error(res.error);
      toast.success("História publicada em Finais felizes!");
      setStoryOpen(false);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`status-${id}`} className="sr-only">Status de {name}</label>
      <NativeSelect id={`status-${id}`} value={status} onChange={(e) => change(e.target.value)} disabled={pending} className="h-10 w-40 text-sm">
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </NativeSelect>
      {pending && <Loader2 className="size-4 animate-spin text-sage-500" />}
      {status === "adotado" && (
        <Button variant="ghost" size="sm" onClick={() => setStoryOpen(true)}><Heart /> História</Button>
      )}
      <Dialog open={storyOpen} onOpenChange={setStoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conte essa história! 💚</DialogTitle>
            <DialogDescription>Histórias de adoção inspiram outras pessoas. Ela aparecerá na página Finais felizes (opcional).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Título" htmlFor="story-title"><Input id="story-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></Field>
            <Field label="Como foi a adoção?" htmlFor="story-body" hint="Não inclua dados pessoais do adotante sem autorização.">
              <Textarea id="story-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStoryOpen(false)}>Agora não</Button>
            <Button onClick={sendStory} disabled={pending || body.trim().length < 20}>Publicar história</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
