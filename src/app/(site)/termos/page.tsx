import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/content/prose";
import { LEGAL_VERSIONS } from "@/lib/constants";

export const metadata: Metadata = { title: "Termos de Uso", alternates: { canonical: "/termos" } };

export default function TermosPage() {
  return (
    <LegalLayout title="Termos de Uso" version={LEGAL_VERSIONS.termos_uso} updated="18 de novembro de 2026">
      <p>
        Bem-vindo(a) ao <strong>AdoteAmigo</strong>. Ao criar uma conta ou utilizar a plataforma, você concorda com
        estes Termos de Uso, com a <Link href="/privacidade">Política de Privacidade</Link>, com as{" "}
        <Link href="/diretrizes">Diretrizes da Comunidade</Link> e com a{" "}
        <Link href="/adocao-responsavel">Política de Adoção Responsável</Link>.
      </p>

      <h2>1. O que é o AdoteAmigo</h2>
      <p>
        O AdoteAmigo é uma plataforma on-line que <strong>conecta</strong> pessoas interessadas em adotar animais a
        pessoas físicas, protetores independentes, ONGs, abrigos e organizações que buscam um novo lar para eles.
      </p>
      <p>
        O AdoteAmigo <strong>não é parte</strong> das adoções: não intermedeia a entrega, não transporta animais, não
        realiza triagem presencial e não garante a identidade, a saúde, o comportamento ou a idoneidade dos
        usuários e dos animais anunciados, salvo quando um selo de verificação indicar expressamente o que foi
        verificado.
      </p>

      <h2>2. Cadastro e conta</h2>
      <ul>
        <li>É necessário ter <strong>18 anos ou mais</strong> para criar uma conta.</li>
        <li>As informações do cadastro devem ser verdadeiras e mantidas atualizadas.</li>
        <li>Você é responsável pela confidencialidade da sua senha e por toda atividade realizada na sua conta.</li>
        <li>O tipo de perfil (pessoa física, protetor, ONG/abrigo ou organização parceira) é declarado pelo próprio usuário. A verificação institucional é feita apenas pela equipe da plataforma.</li>
      </ul>

      <h2>3. Anúncios</h2>
      <ul>
        <li>Qualquer usuário cadastrado pode anunciar animais para <strong>adoção gratuita</strong>.</li>
        <li><strong>É proibida a venda de animais</strong> ou a cobrança de qualquer valor como condição para a adoção, incluindo “taxas”, “reservas” ou “frete”. Ressarcimentos comprovados de despesas veterinárias devem ser combinados com transparência e nunca exigidos antes do contato presencial.</li>
        <li>As publicações são exibidas automaticamente após validações básicas. A plataforma pode suspender ou remover anúncios que violem estes Termos a qualquer momento.</li>
        <li>As informações veterinárias são <strong>declaradas pelo anunciante</strong> e não verificadas pelo AdoteAmigo, salvo indicação expressa.</li>
        <li>O anunciante declara ter o direito de encaminhar o animal para adoção e de publicar as fotos enviadas.</li>
      </ul>

      <h2>4. Comunicação entre usuários</h2>
      <p>
        O chat interno e o botão de WhatsApp existem para facilitar a conversa sobre a adoção. É proibido usá-los
        para spam, assédio, propaganda, golpes ou qualquer finalidade diferente. O número de WhatsApp só é exibido
        quando o anunciante autoriza.
      </p>

      <h2>5. Moderação e penalidades</h2>
      <p>
        Usuários podem denunciar anúncios, perfis e conversas. A equipe pode, conforme a gravidade: remover
        conteúdo, suspender anúncios, suspender ou bloquear contas. Todas as ações administrativas são registradas.
        Conversas privadas só são acessadas pela moderação quando forem denunciadas por um dos participantes.
      </p>

      <h2>6. Responsabilidades</h2>
      <p>
        Cada usuário é responsável pelas informações que publica e pelos acordos que faz com outros usuários.
        Recomendamos fortemente seguir o guia de <Link href="/adocao-responsavel">adoção responsável</Link>,
        realizar encontros em locais seguros e nunca efetuar pagamentos antecipados. Maus-tratos a animais são
        crime (Lei nº 9.605/1998, art. 32).
      </p>

      <h2>7. Exclusão da conta</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em <Link href="/painel/configuracoes">Configurações</Link>.
        Os dados são tratados conforme a <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Estes Termos podem ser atualizados. Alterações relevantes serão comunicadas na plataforma e, quando
        necessário, será solicitado um novo aceite. A versão vigente e a data de atualização aparecem no topo desta
        página.
      </p>

      <h2>9. Legislação e contato</h2>
      <p>
        Estes Termos são regidos pelas leis brasileiras, incluindo o Marco Civil da Internet (Lei nº 12.965/2014) e a
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Dúvidas: <Link href="/contato">fale conosco</Link>.
      </p>
    </LegalLayout>
  );
}
