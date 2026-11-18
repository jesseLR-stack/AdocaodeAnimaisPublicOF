"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { Building2, HandHeart, Handshake, MailCheck, User } from "lucide-react";
import { toast } from "sonner";
import { resendConfirmation, signUp, type FormState } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/forms/password-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormAlert } from "@/components/forms/form-alert";
import { CityPicker } from "@/components/forms/city-picker";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "pessoa_fisica", label: "Pessoa física", hint: "Quero adotar ou doar um animal", icon: User },
  { value: "protetor_independente", label: "Protetor(a)", hint: "Resgato animais de forma independente", icon: HandHeart },
  { value: "ong_abrigo", label: "ONG ou abrigo", hint: "Represento uma instituição", icon: Building2 },
  { value: "organizacao_parceira", label: "Parceiro", hint: "Empresa ou projeto parceiro", icon: Handshake },
];

export function SignUpForm() {
  const [state, action] = useActionState<FormState, FormData>(signUp, {});
  const [type, setType] = useState("pessoa_fisica");
  const [pending, startTransition] = useTransition();
  const fe = state.fieldErrors ?? {};
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-soft ring-1 ring-border/60">
        <MailCheck className="mx-auto size-14 text-sage-500" />
        <h2 className="mt-4 text-2xl font-semibold text-sage-900">Confirme seu e-mail</h2>
        <p className="mt-2 text-sage-700">
          Enviamos um link de confirmação para <strong>{state.message}</strong>. Clique nele para ativar sua conta.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">Não chegou? Confira a caixa de spam.</p>
        <Button
          variant="outline"
          className="mt-6"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const r = await resendConfirmation(state.message!);
              if (r.ok) toast.success("E-mail reenviado!");
              else toast.error(r.error ?? "Não foi possível reenviar.");
            })
          }
        >
          Reenviar e-mail
        </Button>
      </div>
    );
  }

  const maxBirth = new Date();
  maxBirth.setFullYear(maxBirth.getFullYear() - 18);

  return (
    <form action={action} className="mt-8 space-y-6" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-sage-900">Como você vai usar o AdoteAmigo?</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {TYPES.map(({ value, label, hint, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-2xl border-2 bg-white p-3.5 transition",
                type === value ? "border-sage-500 bg-sage-50 ring-4 ring-sage-100" : "border-input hover:border-sage-300",
              )}
            >
              <input type="radio" name="profile_type" value={value} checked={type === value} onChange={() => setType(value)} className="sr-only" />
              <Icon className={cn("size-5", type === value ? "text-sage-600" : "text-muted-foreground")} />
              <span className="text-sm font-bold text-sage-900">{label}</span>
              <span className="text-xs leading-snug text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>
        {type !== "pessoa_fisica" && (
          <p className="mt-2 text-xs text-muted-foreground">
            O tipo de perfil é declarado por você. O selo de verificado é concedido pela equipe após análise.
          </p>
        )}
      </fieldset>

      <Field label={type === "ong_abrigo" || type === "organizacao_parceira" ? "Nome da instituição ou responsável" : "Nome completo"} htmlFor="full_name" error={fe.full_name} required>
        <Input id="full_name" name="full_name" autoComplete="name" defaultValue={v.full_name} aria-invalid={!!fe.full_name} />
      </Field>
      <Field label="E-mail" htmlFor="email" error={fe.email} required>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={!!fe.email} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Senha" htmlFor="password" error={fe.password} hint="Mínimo de 8 caracteres, com letras e números." required>
          <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!fe.password} />
        </Field>
        <Field label="Confirmar senha" htmlFor="confirm_password" error={fe.confirm_password} required>
          <PasswordInput id="confirm_password" name="confirm_password" autoComplete="new-password" aria-invalid={!!fe.confirm_password} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Data de nascimento" htmlFor="birth_date" error={fe.birth_date} hint="É preciso ter 18 anos ou mais." required>
          <Input id="birth_date" name="birth_date" type="date" max={maxBirth.toISOString().slice(0, 10)} defaultValue={v.birth_date} aria-invalid={!!fe.birth_date} />
        </Field>
        <Field label="Telefone (opcional)" htmlFor="phone" error={fe.phone} hint="Não é exibido publicamente.">
          <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(11) 91234-5678" defaultValue={v.phone} aria-invalid={!!fe.phone} />
        </Field>
      </div>
      <CityPicker required error={fe.city_id?.[0] ?? fe.uf?.[0]} defaultUf={v.uf} defaultCityId={v.city_id ? Number(v.city_id) : undefined} />

      <div className="space-y-3 rounded-2xl bg-cream-200/60 p-4">
        <label className="flex items-start gap-3 text-sm text-sage-800">
          <Checkbox name="accept_terms" value="on" className="mt-0.5" aria-invalid={!!fe.accept_terms} />
          <span>
            Li e aceito os <Link href="/termos" target="_blank" className="font-semibold underline">Termos de Uso</Link> e a{" "}
            <Link href="/privacidade" target="_blank" className="font-semibold underline">Política de Privacidade</Link>.
          </span>
        </label>
        {fe.accept_terms && <p className="text-sm font-medium text-destructive" role="alert">{fe.accept_terms[0]}</p>}
        <label className="flex items-start gap-3 text-sm text-sage-800">
          <Checkbox name="accept_guidelines" value="on" className="mt-0.5" aria-invalid={!!fe.accept_guidelines} />
          <span>
            Concordo com as <Link href="/diretrizes" target="_blank" className="font-semibold underline">Diretrizes da Comunidade</Link> e a{" "}
            <Link href="/adocao-responsavel" target="_blank" className="font-semibold underline">Política de Adoção Responsável</Link>.
          </span>
        </label>
        {fe.accept_guidelines && <p className="text-sm font-medium text-destructive" role="alert">{fe.accept_guidelines[0]}</p>}
      </div>

      <SubmitButton size="lg" className="w-full" pendingText="Criando conta…">Criar minha conta</SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta? <Link href="/entrar" className="font-semibold text-sage-700 hover:underline">Entrar</Link>
      </p>
    </form>
  );
}
