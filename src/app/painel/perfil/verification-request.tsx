"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestVerification } from "@/app/actions/account";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function VerificationRequest() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <Textarea rows={3} value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={2000}
        placeholder="Conte como podemos confirmar sua organização (ex.: site, Instagram oficial, CNPJ, contato de referência)." aria-label="Mensagem para a equipe" />
      <Button disabled={pending} onClick={() => start(async () => {
        const res = await requestVerification(msg);
        if (!res.ok) return void toast.error(res.error);
        toast.success("Solicitação enviada! A equipe vai analisar.");
        router.refresh();
      })}>Solicitar verificação</Button>
    </div>
  );
}
