import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { SITE_SLOGAN } from "@/lib/env";

const COLUMNS = [
  {
    title: "Adotar",
    links: [
      { href: "/animais?especie=cachorro", label: "Cães para adoção" },
      { href: "/animais?especie=gato", label: "Gatos para adoção" },
      { href: "/animais?especie=outro", label: "Outros animais" },
      { href: "/adotados", label: "Finais felizes" },
    ],
  },
  {
    title: "Comunidade",
    links: [
      { href: "/protetores", label: "ONGs e protetores" },
      { href: "/painel/anuncios/novo", label: "Anunciar um animal" },
      { href: "/adocao-responsavel", label: "Adoção responsável" },
      { href: "/diretrizes", label: "Diretrizes da comunidade" },
    ],
  },
  {
    title: "AdoteAmigo",
    links: [
      { href: "/sobre", label: "Sobre o projeto" },
      { href: "/faq", label: "Perguntas frequentes" },
      { href: "/contato", label: "Contato" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/termos", label: "Termos de Uso" },
      { href: "/privacidade", label: "Política de Privacidade" },
      { href: "/cookies", label: "Política de Cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-sage-800 text-sage-100">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <div className="inline-flex rounded-2xl bg-cream-100 px-3 py-2"><Logo /></div>
          <p className="mt-4 font-display text-xl text-cream-100">{SITE_SLOGAN}</p>
          <p className="mt-3 text-sm text-sage-200">
            Plataforma que conecta pessoas a animais que precisam de um lar. O AdoteAmigo não realiza
            a entrega dos animais nem garante as informações declaradas pelos anunciantes.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="font-sans text-sm font-bold tracking-wider text-apricot-200 uppercase">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-sage-100 transition hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-sage-700">
        <div className="container-page flex flex-col gap-2 py-6 pb-24 text-xs text-sage-300 sm:flex-row sm:justify-between md:pb-6">
          <p>© {new Date().getFullYear()} AdoteAmigo. Projeto acadêmico de adoção responsável.</p>
          <p>Feito com carinho para quem tem quatro patas (ou duas asas).</p>
        </div>
      </div>
    </footer>
  );
}
