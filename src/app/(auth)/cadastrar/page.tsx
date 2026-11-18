import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta gratuita no AdoteAmigo para adotar ou anunciar animais.",
};

export default function CadastrarPage() {
  return (
    <>
      <h1 className="text-4xl font-semibold text-sage-900">Crie sua conta</h1>
      <p className="mt-2 text-muted-foreground">Gratuita para quem adota e para quem anuncia.</p>
      <SignUpForm />
    </>
  );
}
