import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/content/prose";
import { LEGAL_VERSIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/privacidade" } };

export default function PrivacidadePage() {
  return (
    <LegalLayout title="Política de Privacidade" version={LEGAL_VERSIONS.politica_privacidade} updated="18 de novembro de 2026">
      <p>
        Esta política explica como o AdoteAmigo coleta, usa, compartilha e protege dados pessoais, em conformidade
        com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, e-mail, senha (armazenada de forma criptografada pelo provedor de autenticação), data de nascimento, cidade, estado, tipo de perfil e, opcionalmente, telefone e foto.</li>
        <li><strong>Anúncios:</strong> informações e fotos dos animais, localização aproximada (cidade e bairro/região) e, se você autorizar, número de WhatsApp.</li>
        <li><strong>Uso da plataforma:</strong> favoritos, interesses enviados e recebidos, mensagens do chat, denúncias, notificações e registros de aceite dos documentos legais (documento, versão e data).</li>
        <li><strong>Segurança:</strong> registros de ações para prevenção de spam e fraude e registros de moderação.</li>
      </ul>
      <p>Não coletamos dados sensíveis (art. 5º, II, da LGPD) e não pedimos documentos de identidade.</p>

      <h2>2. Para que usamos os dados (finalidades e bases legais)</h2>
      <ul>
        <li><strong>Executar o serviço</strong> (art. 7º, V): criar sua conta, publicar anúncios, permitir conversas e favoritos.</li>
        <li><strong>Segurança e prevenção a fraudes</strong> (art. 7º, IX — legítimo interesse): limites anti-spam, detecção de anúncios suspeitos e moderação.</li>
        <li><strong>Cumprir obrigações legais</strong> (art. 7º, II): guarda de registros de acesso exigida pelo Marco Civil da Internet.</li>
        <li><strong>Consentimento</strong> (art. 7º, I): exibição do seu WhatsApp para usuários logados, quando você opta por isso.</li>
      </ul>

      <h2>3. O que fica público</h2>
      <p>
        São públicos: seu nome, foto, tipo de perfil, cidade/estado, biografia e os anúncios ativos. <strong>Nunca
        são públicos:</strong> e-mail, telefone do cadastro, data de nascimento e mensagens. O WhatsApp de um
        anúncio só é revelado a usuários logados e somente quando o anunciante escolhe essa forma de contato.
      </p>

      <h2>4. Compartilhamento</h2>
      <p>
        Não vendemos dados. Utilizamos provedores de infraestrutura que atuam como operadores: <strong>Supabase</strong>{" "}
        (banco de dados, autenticação e armazenamento) e <strong>Vercel</strong> (hospedagem). Esses provedores podem
        processar dados fora do Brasil, com salvaguardas contratuais. Podemos compartilhar dados com autoridades
        mediante ordem legal.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <ul>
        <li>Dados da conta e anúncios: enquanto a conta existir.</li>
        <li>Ao excluir a conta: perfil, anúncios, fotos, favoritos e interesses são apagados. Mensagens enviadas a outras pessoas permanecem na conversa do outro participante, sem identificação do autor.</li>
        <li>Registros de moderação e denúncias: mantidos de forma mínima para segurança da comunidade e defesa em processos (art. 16, I e II).</li>
        <li>Registros técnicos anti-spam: até 7 dias. Notificações lidas: até 180 dias.</li>
      </ul>

      <h2>6. Seus direitos (art. 18 da LGPD)</h2>
      <p>Você pode, diretamente no painel:</p>
      <ul>
        <li><strong>Acessar e baixar</strong> seus dados em formato JSON (Configurações → Privacidade).</li>
        <li><strong>Corrigir</strong> dados do perfil a qualquer momento.</li>
        <li><strong>Excluir</strong> sua conta e seus dados.</li>
        <li>Revogar o consentimento para exibição do WhatsApp, editando o anúncio.</li>
      </ul>
      <p>Para outras solicitações, use a página de <Link href="/contato">contato</Link>.</p>

      <h2>7. Idade mínima</h2>
      <p>
        O AdoteAmigo é destinado a maiores de 18 anos, pois a adoção envolve responsabilidade civil pelo animal. Não
        coletamos intencionalmente dados de crianças e adolescentes. Se identificarmos uma conta de menor de idade,
        ela será removida.
      </p>

      <h2>8. Segurança</h2>
      <p>
        Usamos conexão criptografada (HTTPS), senhas com hash, controle de acesso por linha no banco de dados (Row
        Level Security), limitação de requisições e registro de ações administrativas. Nenhum sistema é 100% seguro;
        em caso de incidente relevante, os titulares e a ANPD serão comunicados.
      </p>

      <h2>9. Cookies</h2>
      <p>Veja a <Link href="/cookies">Política de Cookies</Link>.</p>

      <h2>10. Encarregado (DPO) e contato</h2>
      <p>
        Por se tratar de um projeto acadêmico, o canal do encarregado é a página de <Link href="/contato">contato</Link>.
        Em operação comercial, deverá ser indicado um encarregado formalmente.
      </p>
    </LegalLayout>
  );
}
