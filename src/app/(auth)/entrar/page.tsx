import type { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default async function EntrarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <h1 className="text-4xl font-semibold text-sage-900">Que bom te ver!</h1>
      <p className="mt-2 text-muted-foreground">Entre para favoritar, conversar e anunciar animais.</p>
      <SignInForm redirectTo={sp.redirect} linkError={sp.erro === "link-invalido"} />
    </>
  );
}
