import type { Metadata } from "next";
import { LegalLayout } from "@/components/content/prose";

export const metadata: Metadata = { title: "Política de Cookies", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" version="1.0" updated="18 de novembro de 2026">
      <p>
        Cookies são pequenos arquivos salvos no seu navegador. O AdoteAmigo usa <strong>apenas cookies
        estritamente necessários</strong> para o funcionamento do site.
      </p>
      <h2>Cookies que usamos</h2>
      <ul>
        <li><strong>Sessão de autenticação (sb-*-auth-token):</strong> mantém você conectado(a) com segurança. Sem ele, não é possível entrar na conta. Expira ao sair ou após o período de validade da sessão.</li>
      </ul>
      <h2>O que não usamos</h2>
      <ul>
        <li>Não usamos cookies de publicidade.</li>
        <li>Não usamos cookies de rastreamento de terceiros nem redes sociais incorporadas.</li>
        <li>Não usamos ferramentas de análise que identifiquem você.</li>
      </ul>
      <p>
        Por serem estritamente necessários, esses cookies não dependem de consentimento (LGPD, art. 7º, V). Se no
        futuro adotarmos cookies opcionais, pediremos sua autorização antes.
      </p>
      <h2>Como gerenciar</h2>
      <p>
        Você pode apagar cookies nas configurações do navegador. Ao apagar o cookie de sessão, você será
        desconectado(a).
      </p>
    </LegalLayout>
  );
}
