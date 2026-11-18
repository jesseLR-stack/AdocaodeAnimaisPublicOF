"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  adminClearFlags, adminEditAnimal, adminFlagInappropriate, adminSetAnimalStatus, adminSetHealthVerified,
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ReasonAction } from "./reason-action";

export function AnimalAdminActions({
  animal,
}: { animal: { id: string; name: string; description: string; status: string; risk_flags: string[]; health_verified: boolean } }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(animal.name);
  const [description, setDescription] = useState(animal.description);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const hidden = animal.status === "suspenso" || animal.status === "removido";

  return (
    <div className="flex flex-wrap gap-2">
      {hidden ? (
        <ReasonAction label="Restaurar" title={`Restaurar ${animal.name}`} variant="default" defaultReason="Restaurado após análise"
          action={(r) => adminSetAnimalStatus(animal.id, "disponivel", r)} />
      ) : (
        <>
          <ReasonAction label="Suspender" title={`Suspender ${animal.name}`} variant="destructive" action={(r) => adminSetAnimalStatus(animal.id, "suspenso", r)} />
          <ReasonAction label="Inadequado" title="Marcar como inadequado" description="O anúncio será suspenso e marcado como inadequado." action={(r) => adminFlagInappropriate(animal.id, r)} />
          <ReasonAction label="Remover" title={`Remover ${animal.name}`} variant="ghost" action={(r) => adminSetAnimalStatus(animal.id, "removido", r)} />
        </>
      )}
      {animal.risk_flags.length > 0 && (
        <ReasonAction label="Revisado (limpar sinais)" title="Limpar sinalizações automáticas" requireReason={false} defaultReason="Sinalização revisada — sem problemas"
          action={(r) => adminClearFlags(animal.id, r)} />
      )}
      <ReasonAction
        label={animal.health_verified ? "Remover verificação de saúde" : "Verificar saúde"}
        title={animal.health_verified ? "Remover verificação de saúde" : "Marcar informações de saúde como verificadas"}
        description="Use apenas se a equipe conferiu documentos (ex.: carteira de vacinação)."
        action={(r) => adminSetHealthVerified(animal.id, !animal.health_verified, r)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><Button variant="outline" size="sm">Editar</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar anúncio</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Field label="Nome" htmlFor="adm-name"><Input id="adm-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
            <Field label="Descrição" htmlFor="adm-desc"><Textarea id="adm-desc" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} /></Field>
            <Field label="Motivo da edição (registrado e enviado ao anunciante)" htmlFor="adm-reason"><Input id="adm-reason" value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button disabled={pending || reason.trim().length < 3} onClick={() => start(async () => {
              const res = await adminEditAnimal(animal.id, name, description, reason);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Anúncio editado.");
              setOpen(false);
              router.refresh();
            })}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
