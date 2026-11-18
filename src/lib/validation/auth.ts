import { z } from "zod";

export const MIN_AGE = 18;

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.")
  .regex(/[A-Za-z]/, "Use pelo menos uma letra.")
  .regex(/\d/, "Use pelo menos um número.");

function ageOn(date: Date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
  return age;
}

export const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Informe seu nome completo.").max(80),
    email: z.email("Informe um e-mail válido.").max(160),
    password: passwordSchema,
    confirm_password: z.string(),
    birth_date: z.iso.date("Informe sua data de nascimento.").refine(
      (v) => ageOn(new Date(`${v}T12:00:00`)) >= MIN_AGE,
      `É necessário ter ${MIN_AGE} anos ou mais para criar uma conta.`,
    ).refine((v) => ageOn(new Date(`${v}T12:00:00`)) < 120, "Data de nascimento inválida."),
    uf: z.string().length(2, "Selecione o estado."),
    city_id: z.coerce.number({ error: "Selecione a cidade." }).int().positive("Selecione a cidade."),
    profile_type: z.enum(["pessoa_fisica", "protetor_independente", "ong_abrigo", "organizacao_parceira"]),
    phone: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v === "" || (v.length >= 10 && v.length <= 11), "Telefone inválido (use DDD + número).")
      .optional(),
    accept_terms: z.literal("on", { error: "É necessário aceitar os Termos de Uso e a Política de Privacidade." }),
    accept_guidelines: z.literal("on", { error: "É necessário aceitar as Diretrizes da Comunidade." }),
  })
  .refine((d) => d.password === d.confirm_password, { path: ["confirm_password"], message: "As senhas não conferem." });

export const signInSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const emailSchema = z.object({ email: z.email("Informe um e-mail válido.") });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm_password: z.string() })
  .refine((d) => d.password === d.confirm_password, { path: ["confirm_password"], message: "As senhas não conferem." });

/** Evita redirecionamento aberto: aceita apenas caminhos internos. */
export function safeRedirect(value: unknown, fallback = "/painel") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

export function translateAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada (e o spam).";
  if (m.includes("already registered") || m.includes("already been registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("password") && m.includes("weak")) return "Senha fraca. Use letras e números, com pelo menos 8 caracteres.";
  if (m.includes("same password") || m.includes("should be different")) return "A nova senha deve ser diferente da anterior.";
  if (m.includes("database error")) return "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.";
  return "Algo deu errado. Tente novamente em instantes.";
}
