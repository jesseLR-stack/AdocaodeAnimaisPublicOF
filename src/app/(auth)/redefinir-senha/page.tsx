"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updatePassword, type FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";

export default function RedefinirSenhaPage() {
  const [state, action] = useActionState<FormState, FormData>(updatePassword, {});
  if (state.ok) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-14 text-sage-500" />
        <h1 className="mt-4 text-3xl font-semibold text-sage-900">Senha alterada!</h1>
        <p className="mt-2 text-sage-700">Sua nova senha já está valendo.</p>
        <Button asChild className="mt-6" size="lg"><Link href="/painel">Ir para o painel</Link></Button>
      </div>
    );
  }
  const fe = state.fieldErrors ?? {};
  return (
    <>
      <h1 className="text-4xl font-semibold text-sage-900">Crie uma nova senha</h1>
      <p className="mt-2 text-muted-foreground">Use pelo menos 8 caracteres, com letras e números.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Field label="Nova senha" htmlFor="password" error={fe.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" autoFocus />
        </Field>
        <Field label="Confirmar nova senha" htmlFor="confirm_password" error={fe.confirm_password}>
          <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" />
        </Field>
        <SubmitButton size="lg" className="w-full">Salvar nova senha</SubmitButton>
      </form>
    </>
  );
}
