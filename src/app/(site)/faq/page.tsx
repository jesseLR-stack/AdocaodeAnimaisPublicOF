import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: "Tire suas dúvidas sobre como adotar, anunciar, conversar e manter sua conta segura no AdoteAmigo.",
  alternates: { canonical: "/faq" },
};

const FAQ: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: "Adoção",
    items: [
      { q: "Adotar pelo AdoteAmigo tem algum custo?", a: "Não. A plataforma é gratuita e é proibido cobrar pela adoção. Desconfie de pedidos de PIX, taxa de reserva ou frete." },
      { q: "Como demonstro interesse em um animal?", a: "Na página do animal, clique em “Tenho interesse em adotar” e escreva uma mensagem contando sobre você e sua casa. O anunciante recebe uma notificação." },
      { q: "Registrar interesse garante a adoção?", a: "Não. O interesse é o primeiro contato. A adoção só acontece depois que você e o anunciante conversarem e combinarem tudo." },
      { q: "As informações de saúde são confiáveis?", a: "Elas são declaradas pelo anunciante. Quando não foram verificadas pela equipe, o anúncio mostra isso claramente. Peça carteira de vacinação e leve o animal ao veterinário." },
      { q: "Posso adotar animais de outro estado?", a: "Pode, mas recomendamos conhecer o animal pessoalmente. Use o filtro de distância para encontrar animais perto de você." },
    ],
  },
  {
    group: "Anúncios",
    items: [
      { q: "Quem pode anunciar?", a: "Qualquer pessoa com conta, maior de 18 anos: pessoas físicas, protetores independentes, ONGs, abrigos e organizações parceiras." },
      { q: "Meu anúncio precisa ser aprovado?", a: "Não. Ele é publicado automaticamente após as validações. A moderação pode suspender anúncios que violem as diretrizes." },
      { q: "Quantas fotos posso enviar?", a: "Até 10 fotos por animal (JPG, PNG ou WebP, até 5 MB cada). Elas são comprimidas automaticamente." },
      { q: "O animal foi adotado. E agora?", a: "No painel, em “Meus anúncios”, altere o status para “Adotado”. Quem favoritou o animal recebe a boa notícia, e você pode escrever uma história de adoção." },
    ],
  },
  {
    group: "Conversas e segurança",
    items: [
      { q: "Meu telefone fica público?", a: "Não. O telefone do cadastro nunca é exibido. No anúncio, você pode autorizar o WhatsApp, que só é revelado a usuários logados." },
      { q: "Como bloqueio ou denuncio alguém?", a: "Dentro da conversa, use os botões “Bloquear” e “Denunciar”. Nos anúncios e perfis, use “Denunciar”." },
      { q: "A equipe lê minhas mensagens?", a: "Não. A moderação só tem acesso a conversas que foram denunciadas por um dos participantes." },
      { q: "O que significa o selo de verificado?", a: "Que a equipe do AdoteAmigo verificou que aquela conta representa a organização informada. Não é uma garantia sobre cada animal anunciado." },
    ],
  },
  {
    group: "Conta e privacidade",
    items: [
      { q: "Por que preciso ter 18 anos?", a: "A adoção envolve responsabilidade civil pelo animal. Menores podem adotar junto com os pais ou responsáveis, usando a conta deles." },
      { q: "Como baixo ou excluo meus dados?", a: <>Em <Link href="/painel/configuracoes" className="font-semibold underline">Configurações → Privacidade</Link> você baixa todos os seus dados ou exclui a conta.</> },
      { q: "Esqueci minha senha.", a: <>Use a opção <Link href="/recuperar-senha" className="font-semibold underline">Esqueci minha senha</Link> na tela de login.</> },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.flatMap((g) => g.items.filter((i) => typeof i.a === "string").map((i) => ({
      "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a as string },
    }))),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Ajuda" title="Perguntas frequentes" description="Não encontrou sua dúvida? Fale com a gente na página de contato." />
      <div className="container-page grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Seções" className="hidden lg:block">
          <ul className="sticky top-28 space-y-1">
            {FAQ.map((g) => (
              <li key={g.group}><a href={`#${g.group}`} className="block rounded-xl px-3 py-2 font-semibold text-sage-700 hover:bg-sage-100">{g.group}</a></li>
            ))}
          </ul>
        </nav>
        <div className="space-y-10">
          {FAQ.map((g) => (
            <section key={g.group} id={g.group} className="scroll-mt-28">
              <h2 className="mb-4 text-2xl font-semibold text-sage-900">{g.group}</h2>
              <div className="space-y-3">
                {g.items.map((item) => (
                  <details key={item.q} className="group rounded-2xl bg-white shadow-soft ring-1 ring-border/60 open:ring-sage-300">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-sage-900 [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown className="size-5 shrink-0 text-sage-500 transition group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 text-sage-700">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
