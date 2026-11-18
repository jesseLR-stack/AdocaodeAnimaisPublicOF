"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePassword, deleteAccount, exportMyData } from "@/app/actions/account";
import type { FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ChangePasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  const fe = state.fieldErrors ?? {};
  useEffect(() => { if (state.ok) toast.success(state.message); }, [state]);
  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Field label="Senha atual" htmlFor="current_password" error={fe.current_password}>
        <PasswordInput id="current_password" name="current_password" autoComplete="current-password" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nova senha" htmlFor="password" error={fe.password}><PasswordInput id="password" name="password" autoComplete="new-password" /></Field>
        <Field label="Confirmar nova senha" htmlFor="confirm_password" error={fe.confirm_password}><PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" /></Field>
      </div>
      <SubmitButton pendingText="Salvando…">Alterar senha</SubmitButton>
    </form>
  );
}

export function ExportDataButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => {
      const res = await exportMyData();
      if (!res.ok) return void toast.error(res.error);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `adoteamigo-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Download iniciado.");
    })}>
      {pending ? <Loader2 className="animate-spin" /> : <Download />} Baixar meus dados (JSON)
    </Button>
  );
}

export function DeleteAccountDialog() {
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, {});
  const [open, setOpen] = useState(false);
  const fe = state.fieldErrors ?? {};
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="destructive">Excluir minha conta</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta definitivamente</DialogTitle>
          <DialogDescription>
            Seu perfil, anúncios, fotos, favoritos e interesses serão apagados. Mensagens enviadas continuarão visíveis
            para o outro participante, sem seu nome. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4" noValidate>
          {state.error && <FormAlert>{state.error}</FormAlert>}
          <Field label="Sua senha" htmlFor="del-password" error={fe.password}><PasswordInput id="del-password" name="password" autoComplete="current-password" /></Field>
          <Field label='Digite "EXCLUIR" para confirmar' htmlFor="del-confirm" error={fe.confirm}><Input id="del-confirm" name="confirm" autoComplete="off" /></Field>
          <SubmitButton variant="destructive" className="w-full" pendingText="Excluindo…">Excluir permanentemente</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
