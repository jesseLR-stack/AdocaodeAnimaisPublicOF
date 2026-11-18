import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader } from "@/components/dashboard/dash-header";
import { signOut } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { ChangePasswordForm, DeleteAccountDialog, ExportDataButton } from "./settings-forms";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Configurações e privacidade" };

const DOC_LABEL: Record<string, { label: string; href: string }> = {
  termos_uso: { label: "Termos de Uso", href: "/termos" },
  politica_privacidade: { label: "Política de Privacidade", href: "/privacidade" },
  diretrizes_comunidade: { label: "Diretrizes da Comunidade", href: "/diretrizes" },
  politica_adocao: { label: "Política de Adoção Responsável", href: "/adocao-responsavel" },
};

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-border/60 sm:p-7">
      <h2 className="text-xl font-semibold text-sage-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function ConfiguracoesPage() {
  const user = await requireUser("/painel/configuracoes");
  const supabase = await createClient();
  const [{ data: terms }, { data: blocks }] = await Promise.all([
    supabase.from("terms_acceptances").select("document, version, accepted_at").eq("user_id", user.id).order("accepted_at", { ascending: false }),
    supabase.from("user_blocks").select("blocked_id, created_at, profiles!user_blocks_blocked_id_fkey(full_name)").eq("blocker_id", user.id),
  ]);

  return (
    <>
      <DashHeader title="Configurações e privacidade" description="Gerencie sua senha, seus dados pessoais e sua conta." />
      <div className="space-y-6">
        <Section title="Alterar senha"><ChangePasswordForm /></Section>

        <Section title="Privacidade e seus dados (LGPD)" description="Você tem direito de acessar, corrigir e excluir seus dados pessoais.">
          <ul className="mb-5 space-y-1.5 text-sm text-sage-800">
            <li>• Seu e-mail, telefone e data de nascimento <strong>nunca</strong> são exibidos publicamente.</li>
            <li>• O WhatsApp só aparece nos anúncios em que você escolheu esse contato.</li>
            <li>• Conversas só são acessadas pela moderação se forem denunciadas.</li>
          </ul>
          <ExportDataButton />
          <h3 className="mt-6 font-semibold text-sage-900">Documentos aceitos</h3>
          <ul className="mt-2 divide-y divide-border/70 text-sm">
            {(terms ?? []).map((t) => (
              <li key={`${t.document}-${t.version}`} className="flex flex-wrap justify-between gap-2 py-2">
                <Link href={DOC_LABEL[t.document]?.href ?? "#"} className="font-medium text-sage-800 underline-offset-4 hover:underline">
                  {DOC_LABEL[t.document]?.label ?? t.document} (v{t.version})
                </Link>
                <span className="text-muted-foreground">aceito em {formatDateTime(t.accepted_at)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Usuários bloqueados">
          {(blocks?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Você não bloqueou ninguém. É possível bloquear usuários pelo menu da conversa.</p>
          ) : (
            <ul className="text-sm">
              {blocks!.map((b) => (
                <li key={b.blocked_id} className="py-1.5">{(b.profiles as unknown as { full_name: string } | null)?.full_name ?? "Usuário"} — desbloqueie pela conversa.</li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Sessão">
          <form action={signOut}><SubmitButton variant="outline" pendingText="Saindo…">Encerrar sessão</SubmitButton></form>
        </Section>

        <Section title="Excluir conta" description="Remove permanentemente sua conta e seus dados, conforme a Política de Privacidade.">
          <DeleteAccountDialog />
        </Section>
      </div>
    </>
  );
}
