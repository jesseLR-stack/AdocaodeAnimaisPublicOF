import type { Metadata } from "next";
import Link from "next/link";
import { Flag, HelpCircle, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { getCurrentUser } from "@/lib/auth";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a equipe do AdoteAmigo: dúvidas, parcerias, verificação de ONGs e privacidade.",
  alternates: { canonical: "/contato" },
};

export default async function ContatoPage() {
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader eyebrow="Contato" title="Fale com a gente" description="Parcerias, dúvidas, verificação de ONGs ou solicitações sobre seus dados pessoais." />
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_360px]">
        <ContactForm defaultName={user?.profile.full_name} defaultEmail={user?.email ?? undefined} />
        <aside className="space-y-4">
          {[
            { icon: HelpCircle, t: "Dúvidas frequentes", d: "Muitas respostas já estão na nossa central.", href: "/faq", l: "Ver perguntas frequentes" },
            { icon: Flag, t: "Denunciar um anúncio", d: "Use o botão “Denunciar” na página do animal para agilizar a análise.", href: "/animais", l: "Ir para os animais" },
            { icon: ShieldAlert, t: "Maus-tratos", d: "Em caso de urgência, procure a polícia (190) ou a delegacia de proteção animal.", href: "/diretrizes", l: "Diretrizes da comunidade" },
          ].map(({ icon: Icon, t, d, href, l }) => (
            <div key={t} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60">
              <Icon className="size-6 text-apricot-500" />
              <p className="mt-2 font-semibold text-sage-900">{t}</p>
              <p className="mt-1 text-sm text-sage-700">{d}</p>
              <Link href={href} className="mt-2 inline-block text-sm font-semibold text-sage-700 underline underline-offset-4">{l}</Link>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
