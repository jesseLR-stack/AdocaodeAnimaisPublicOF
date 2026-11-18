import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Lock, MessageCircleHeart, ShieldCheck, Sprout, Users } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Sobre o projeto",
  description: "Conheça a missão do AdoteAmigo: conectar animais a lares responsáveis em todo o Brasil.",
  alternates: { canonical: "/sobre" },
};

const VALUES = [
  { icon: Heart, t: "Acolhimento", d: "Cada anúncio é uma história. Tratamos animais e pessoas com carinho e respeito." },
  { icon: ShieldCheck, t: "Confiança", d: "Moderação ativa, denúncias, limites anti-spam e transparência sobre o que é ou não verificado." },
  { icon: Lock, t: "Privacidade", d: "Telefones não ficam expostos. Você conversa pelo chat e só compartilha o WhatsApp se quiser." },
  { icon: Users, t: "Aberto a todos", d: "Pessoas físicas, protetores independentes, ONGs e abrigos anunciam gratuitamente." },
  { icon: MessageCircleHeart, t: "Conexão", d: "Ferramentas para conversar, demonstrar interesse e acompanhar cada passo." },
  { icon: Sprout, t: "Crescimento", d: "Nascemos pequenos, mas preparados para atender todo o Brasil." },
];

export default async function SobrePage() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_stats");
  const s = (data ?? {}) as { available?: number; adopted?: number; advertisers?: number; cities?: number };
  return (
    <>
      <PageHeader
        eyebrow="Sobre o AdoteAmigo"
        title="Uma nova história começa com uma adoção."
        description="O AdoteAmigo é uma plataforma nacional e gratuita que conecta animais que precisam de um lar a pessoas dispostas a adotar com responsabilidade."
      />
      <div className="container-page py-12">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Animais esperando um lar", s.available], ["Finais felizes", s.adopted],
            ["Anunciantes", s.advertisers], ["Cidades", s.cities],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-border/60">
              <dd className="font-display text-4xl font-semibold text-sage-800">{value ?? 0}</dd>
              <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-sage-900">Nossa missão</h2>
            <p className="mt-4 text-lg text-sage-800">
              Milhões de cães e gatos vivem nas ruas ou em abrigos no Brasil. Ao mesmo tempo, muitas pessoas querem
              adotar, mas não sabem onde procurar ou têm receio de golpes. O AdoteAmigo reúne anúncios de todo o país
              em um só lugar, com busca por localização, informações claras e ferramentas de segurança.
            </p>
            <p className="mt-4 text-sage-800">
              Não vendemos animais e não intermediamos a entrega: nosso papel é aproximar pessoas e facilitar uma
              decisão consciente. Também não afirmamos que um anunciante é confiável sem uma verificação real —
              perfis verificados mostram um selo específico.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {VALUES.map(({ icon: Icon, t, d }) => (
              <li key={t} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60">
                <Icon className="size-6 text-apricot-500" />
                <p className="mt-2 font-semibold text-sage-900">{t}</p>
                <p className="mt-1 text-sm text-sage-700">{d}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-14 rounded-[2rem] bg-sage-700 p-8 text-white sm:p-10">
          <h2 className="text-2xl font-semibold">Próximos passos do projeto</h2>
          <p className="mt-2 max-w-2xl text-sage-100">
            A arquitetura já está preparada para: aplicativo móvel, painéis para ONGs, campanhas de adoção, alertas
            personalizados por região, programa de voluntariado e estatísticas públicas de adoção.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg"><Link href="/cadastrar">Criar minha conta</Link></Button>
            <Button asChild variant="outline" size="lg" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Link href="/contato">Quero ser parceiro</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
