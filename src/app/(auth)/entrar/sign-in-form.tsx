"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";

export function SignInForm({ redirectTo, linkError }: { redirectTo?: string; linkError?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(signIn, {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-8 space-y-5" noValidate>
      {linkError && !state.error && (
        <FormAlert>O link expirou ou já foi usado. Entre com sua senha ou solicite um novo link.</FormAlert>
      )}
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <input type="hidden" name="redirect" value={redirectTo ?? "/painel"} />
      <Field label="E-mail" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} aria-invalid={!!fe.email} autoFocus />
      </Field>
      <Field label="Senha" htmlFor="password" error={fe.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" aria-invalid={!!fe.password} />
      </Field>
      <div className="flex justify-end">
        <Link href="/recuperar-senha" className="text-sm font-semibold text-sage-700 hover:underline">Esqueci minha senha</Link>
      </div>
      <SubmitButton size="lg" className="w-full" pendingText="Entrando…">Entrar</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta? <Link href="/cadastrar" className="font-semibold text-sage-700 hover:underline">Cadastre-se grátis</Link>
      </p>
    </form>
  );
}
