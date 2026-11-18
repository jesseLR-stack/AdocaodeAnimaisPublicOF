import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CalendarHeart, Coins, Home, Stethoscope, Users } from "lucide-react";
import { PageHeader } from "@/components/content/page-header";
import { Prose } from "@/components/content/prose";
import { Button } from "@/components/ui/button";
import { LEGAL_VERSIONS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Política de Adoção Responsável",
  description: "Guia para adotar com segurança e responsabilidade: o que avaliar antes, durante e depois da adoção.",
  alternates: { canonical: "/adocao-responsavel" },
};

const CHECKLIST = [
  { icon: Home, t: "Espaço", d: "O animal cabe na sua casa? Há telas em janelas (gatos) e muros seguros (cães)?" },
  { icon: CalendarHeart, t: "Tempo", d: "Cães vivem 10–16 anos e gatos até 20. Você terá tempo para passeios, brincadeiras e cuidados?" },
  { icon: Coins, t: "Custos", d: "Ração, vacinas anuais, vermífugo, antipulgas, castração e emergências veterinárias." },
  { icon: Users, t: "Família", d: "Todos na casa concordam com a adoção? Alguém tem alergia? Há outros animais?" },
  { icon: Stethoscope, t: "Saúde", d: "Leve o animal ao veterinário nos primeiros dias, mesmo que esteja vacinado." },
];

export default function AdocaoResponsavelPage() {
  return (
    <>
      <PageHeader
        eyebrow={`Política de adoção responsável · versão ${LEGAL_VERSIONS.politica_adocao}`}
        title="Adotar é um compromisso para a vida toda"
        description="Um guia prático para quem quer adotar e para quem quer encontrar um novo lar para um animal."
      />
      <div className="container-page py-12">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CHECKLIST.map(({ icon: Icon, t, d }) => (
            <li key={t} className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border/60">
              <Icon className="size-7 text-sage-600" />
              <p className="mt-3 font-display text-lg font-semibold text-sage-900">{t}</p>
              <p className="mt-1 text-sm text-sage-700">{d}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex gap-4 rounded-3xl bg-apricot-100 p-6">
          <AlertTriangle className="size-7 shrink-0 text-apricot-600" />
          <div>
            <p className="font-semibold text-sage-900">Animal não se compra no AdoteAmigo.</p>
            <p className="mt-1 text-sage-800">
              Nunca faça pagamentos antecipados por “taxa de adoção”, “reserva” ou “transporte”. Esses pedidos são o
              golpe mais comum em sites de adoção. Se acontecer, denuncie o anúncio.
            </p>
          </div>
        </div>

        <Prose className="mt-6">
          <h2>Para quem vai adotar</h2>
          <ol>
            <li><strong>Pesquise com calma.</strong> Use os filtros de porte, idade e temperamento para encontrar um animal compatível com sua rotina.</li>
            <li><strong>Demonstre interesse</strong> contando um pouco sobre sua casa e sua experiência com animais.</li>
            <li><strong>Converse</strong> pelo chat do AdoteAmigo ou WhatsApp e faça todas as perguntas: saúde, alimentação, comportamento.</li>
            <li><strong>Conheça o animal pessoalmente</strong> antes de decidir, de preferência em local público ou na sede da ONG.</li>
            <li><strong>Formalize:</strong> muitas ONGs usam um termo de adoção. Leia com atenção antes de assinar.</li>
            <li><strong>Prepare a casa:</strong> comedouro, bebedouro, cama, caixa de areia (gatos), coleira com identificação.</li>
            <li><strong>Período de adaptação:</strong> é normal o animal ficar tímido nos primeiros dias. Tenha paciência.</li>
          </ol>

          <h2>Para quem vai anunciar</h2>
          <ul>
            <li>Descreva o animal com honestidade, incluindo comportamentos difíceis e necessidades especiais.</li>
            <li>Sempre que possível, entregue o animal castrado, vacinado e vermifugado — ou oriente o adotante.</li>
            <li>Converse com calma com os interessados. Você pode recusar quem não parecer preparado.</li>
            <li>Marque o anúncio como <strong>adotado</strong> assim que a adoção acontecer.</li>
            <li>Se possível, acompanhe a adaptação nas primeiras semanas.</li>
          </ul>

          <h2>O papel do AdoteAmigo</h2>
          <p>
            Registrar interesse <strong>não significa</strong> que a adoção foi aprovada ou concluída. A decisão é sempre
            entre anunciante e adotante. As informações de saúde são declaradas pelo anunciante e, quando não
            verificadas, isso aparece claramente no anúncio. A plataforma oferece ferramentas de comunicação, denúncia
            e moderação, mas não garante a identidade ou a idoneidade dos usuários.
          </p>

          <h2>Abandono e maus-tratos são crime</h2>
          <p>
            Abandonar ou maltratar animais é crime previsto no art. 32 da Lei nº 9.605/1998, com pena agravada para cães
            e gatos (Lei nº 14.064/2020). Se não puder mais cuidar de um animal, anuncie-o de forma responsável.
          </p>
        </Prose>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href="/animais">Encontrar um animal</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/painel/anuncios/novo">Anunciar um animal</Link></Button>
        </div>
      </div>
    </>
  );
}
