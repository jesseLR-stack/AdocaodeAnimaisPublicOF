"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/** Botão de ação administrativa que exige motivo (registrado na auditoria). */
export function ReasonAction({
  label, title, description, confirmLabel, variant = "outline", requireReason = true, defaultReason = "", action, size = "sm",
}: {
  label: React.ReactNode;
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  requireReason?: boolean;
  defaultReason?: string;
  action: (reason: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(defaultReason);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={variant} size={size}>{label}</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason">Motivo {requireReason ? "(obrigatório — fica registrado na auditoria)" : "(opcional)"}</Label>
          <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant={variant === "outline" || variant === "ghost" ? "default" : variant}
            disabled={pending || (requireReason && reason.trim().length < 3)}
            onClick={() => start(async () => {
              const res = await action(reason.trim());
              if (!res.ok) return void toast.error(res.error);
              toast.success("Ação registrada.");
              setOpen(false);
              router.refresh();
            })}
          >
            {pending && <Loader2 className="animate-spin" />} {confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
