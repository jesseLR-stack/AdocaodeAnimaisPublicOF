import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/content/prose";
import { LEGAL_VERSIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "Diretrizes da Comunidade", alternates: { canonical: "/diretrizes" } };

export default function DiretrizesPage() {
  return (
    <LegalLayout title="Diretrizes da Comunidade" version={LEGAL_VERSIONS.diretrizes_comunidade} updated="18 de novembro de 2026">
      <p>
        O AdoteAmigo existe para que mais animais encontrem lares responsáveis. Estas regras valem para anúncios,
        perfis, mensagens e histórias. Ao publicar, você concorda com elas.
      </p>
      <h2>✅ O que esperamos</h2>
      <ul>
        <li>Fotos reais e atuais do animal anunciado.</li>
        <li>Informações honestas sobre saúde, temperamento e necessidades especiais.</li>
        <li>Respeito e gentileza nas conversas, inclusive ao recusar um interessado.</li>
        <li>Atualizar o status do anúncio quando o animal for adotado ou não estiver mais disponível.</li>
      </ul>
      <h2>🚫 O que não é permitido</h2>
      <ul>
        <li><strong>Vender animais</strong> ou cobrar qualquer valor para a adoção (taxa, reserva, “frete”, PIX antecipado).</li>
        <li>Anunciar animais silvestres sem autorização do órgão ambiental competente (Lei nº 9.605/1998).</li>
        <li>Publicar o mesmo animal várias vezes ou anúncios falsos.</li>
        <li>Links para sites externos suspeitos, correntes ou propaganda.</li>
        <li>Imagens de violência, maus-tratos ou conteúdo sexual.</li>
        <li>Discurso de ódio, discriminação, assédio ou ameaças.</li>
        <li>Pedir dados pessoais desnecessários (documentos, senhas, dados bancários).</li>
      </ul>
      <h2>🛡️ Como protegemos a comunidade</h2>
      <ul>
        <li>Sinalização automática de anúncios com termos de venda, links externos ou publicações repetidas.</li>
        <li>Limite de publicações e mensagens por dia para evitar spam.</li>
        <li>Botão de denúncia em todos os anúncios, perfis e conversas.</li>
        <li>Bloqueio de usuários no chat.</li>
        <li>Suspensão ou bloqueio de contas que violem as regras, com registro de cada decisão.</li>
      </ul>
      <p>
        Viu algo errado? Use o botão <strong>Denunciar</strong> no anúncio ou na conversa. Em caso de maus-tratos,
        procure também a polícia ou a delegacia de proteção animal da sua cidade. Veja também os{" "}
        <Link href="/termos">Termos de Uso</Link>.
      </p>
    </LegalLayout>
  );
}
