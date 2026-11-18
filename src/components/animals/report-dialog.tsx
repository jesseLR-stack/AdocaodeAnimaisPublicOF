"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { submitReport } from "@/app/actions/animal-contact";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { REPORT_REASON_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReportDialog({
  targetType, targetId, isLoggedIn, trigger,
}: { targetType: "animal" | "usuario" | "conversa"; targetId: string; isLoggedIn: boolean; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function submit() {
    start(async () => {
      const res = await submitReport({ targetType, targetId, reason: reason as never, description });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Denúncia enviada. Obrigado por ajudar a proteger a comunidade!");
      setOpen(false);
      setReason("");
      setDescription("");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o && !isLoggedIn) {
          router.push(`/entrar?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="text-muted-foreground"><Flag /> Denunciar</Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar {targetType === "animal" ? "anúncio" : targetType === "conversa" ? "conversa" : "usuário"}</DialogTitle>
          <DialogDescription>
            Sua denúncia é anônima para a outra pessoa e será analisada pela equipe de moderação.
          </DialogDescription>
        </DialogHeader>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-sage-900">Motivo</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(REPORT_REASON_LABEL).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition",
                  reason === value ? "border-apricot-400 bg-apricot-100" : "border-input hover:border-sage-300",
                )}
              >
                <input type="radio" name="reason" value={value} checked={reason === value} onChange={() => setReason(value)} className="accent-apricot-500" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-col gap-2">
          <Label htmlFor="report-desc">Detalhes (opcional)</Label>
          <Textarea id="report-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} placeholder="Conte o que aconteceu" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={!reason || pending} onClick={submit}>Enviar denúncia</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
