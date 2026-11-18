"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { sendContact, type ContactState } from "@/app/actions/contact";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/select";
import { SubmitButton } from "@/components/forms/submit-button";

export function ContactForm({ defaultName, defaultEmail }: { defaultName?: string; defaultEmail?: string }) {
  const [state, action] = useActionState<ContactState, FormData>(sendContact, {});
  if (state.ok) {
    return (
      <div className="flex flex-col items-center rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-border/60">
        <CheckCircle2 className="size-12 text-sage-500" />
        <p className="mt-3 font-display text-2xl font-semibold text-sage-900">Mensagem enviada!</p>
        <p className="mt-1 text-muted-foreground">Obrigado pelo contato. Responderemos pelo e-mail informado.</p>
      </div>
    );
  }
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60 sm:p-8" noValidate>
      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800" role="alert">{state.error}</p>}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name" error={fe.name} required>
          <Input id="name" name="name" defaultValue={defaultName} autoComplete="name" aria-invalid={!!fe.name} />
        </Field>
        <Field label="E-mail" htmlFor="email" error={fe.email} required>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} autoComplete="email" aria-invalid={!!fe.email} />
        </Field>
      </div>
      <Field label="Assunto" htmlFor="subject" error={fe.subject} required>
        <NativeSelect id="subject" name="subject" defaultValue="Dúvida">
          <option>Dúvida</option>
          <option>Parceria com ONG ou empresa</option>
          <option>Verificação de perfil institucional</option>
          <option>Privacidade e dados pessoais (LGPD)</option>
          <option>Problema técnico</option>
          <option>Outro</option>
        </NativeSelect>
      </Field>
      <Field label="Mensagem" htmlFor="message" error={fe.message} required>
        <Textarea id="message" name="message" rows={6} aria-invalid={!!fe.message} />
      </Field>
      <div aria-hidden className="hidden">
        <label htmlFor="website">Não preencha</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <SubmitButton size="lg" className="w-full sm:w-auto">Enviar mensagem</SubmitButton>
    </form>
  );
}
