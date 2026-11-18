"use client";

import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { requestPasswordReset, type FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";

export default function RecuperarSenhaPage() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto size-14 text-sage-500" />
        <h1 className="mt-4 text-3xl font-semibold text-sage-900">Verifique seu e-mail</h1>
        <p className="mt-2 text-sage-700">
          Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha.
        </p>
        <Link href="/entrar" className="mt-6 inline-block font-semibold text-sage-700 hover:underline">Voltar para o login</Link>
      </div>
    );
  }
  return (
    <>
      <h1 className="text-4xl font-semibold text-sage-900">Esqueceu a senha?</h1>
      <p className="mt-2 text-muted-foreground">Informe seu e-mail e enviaremos um link para redefini-la.</p>
      <form action={action} className="mt-8 space-y-5" noValidate>
        {state.error && <FormAlert>{state.error}</FormAlert>}
        <Field label="E-mail" htmlFor="email" error={state.fieldErrors?.email}>
          <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} autoFocus />
        </Field>
        <SubmitButton size="lg" className="w-full">Enviar link</SubmitButton>
        <p className="text-center text-sm"><Link href="/entrar" className="font-semibold text-sage-700 hover:underline">Voltar para o login</Link></p>
      </form>
    </>
  );
}
