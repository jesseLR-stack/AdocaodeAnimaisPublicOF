import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashHeader } from "@/components/dashboard/dash-header";
import { AvatarUpload } from "@/components/dashboard/avatar-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";
import { VerificationRequest } from "./verification-request";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const user = await requireUser("/painel/perfil");
  const supabase = await createClient();
  const [{ data: priv }, { data: org }] = await Promise.all([
    supabase.from("profiles_private").select("phone").eq("id", user.id).maybeSingle(),
    supabase.from("organizations").select("id, name, description, website, instagram, cnpj, verified_at, organization_verifications(status, created_at, reviewer_note)").eq("owner_id", user.id).maybeSingle(),
  ]);
  const p = user.profile;
  const verifications = ((org?.organization_verifications ?? []) as { status: string; created_at: string; reviewer_note: string | null }[])
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const pending = verifications.find((v) => v.status === "pendente");
  const isOrgType = p.profile_type !== "pessoa_fisica";

  return (
    <>
      <DashHeader
        title="Meu perfil"
        description="Essas informações aparecem no seu perfil público e nos seus anúncios."
        action={<Button asChild variant="outline"><Link href={`/protetores/${p.slug}`}><ExternalLink /> Ver perfil público</Link></Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="space-y-8 rounded-3xl bg-white p-5 ring-1 ring-border/60 sm:p-8">
          <AvatarUpload userId={user.id} name={p.full_name} current={p.avatar_url} />
          <ProfileForm profile={p} phone={priv?.phone ?? null} org={org} />
        </section>
        <aside className="space-y-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-border/60">
            <p className="font-semibold text-sage-900">Verificação do perfil</p>
            {p.is_verified ? (
              <Badge variant="success" className="mt-2"><BadgeCheck /> Perfil verificado</Badge>
            ) : !isOrgType ? (
              <p className="mt-2 text-sm text-muted-foreground">A verificação é destinada a protetores, ONGs, abrigos e organizações parceiras.</p>
            ) : pending ? (
              <p className="mt-2 text-sm text-sage-700">Solicitação enviada em {formatDate(pending.created_at)}. Aguarde a análise da equipe.</p>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-muted-foreground">
                  O selo indica que a equipe confirmou que este perfil representa a organização ou o protetor informado.
                  {p.profile_type === "protetor_independente" ? " Salve o perfil como ONG/organização para enviar dados institucionais, ou descreva seu trabalho de proteção." : ""}
                </p>
                {verifications[0]?.status === "rejeitada" && (
                  <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">Última solicitação não aprovada{verifications[0].reviewer_note ? `: ${verifications[0].reviewer_note}` : "."}</p>
                )}
                {org ? <VerificationRequest /> : <p className="text-sm text-sage-700">Preencha e salve os dados da organização para solicitar.</p>}
              </div>
            )}
          </div>
          <div className="rounded-3xl bg-white p-5 text-sm ring-1 ring-border/60">
            <p className="font-semibold text-sage-900">Conta</p>
            <p className="mt-2 text-muted-foreground">E-mail: <span className="text-sage-800">{user.email}</span></p>
            <p className="text-muted-foreground">Membro desde {formatDate(p.created_at)}</p>
            <Link href="/painel/configuracoes" className="mt-2 inline-block font-semibold text-sage-700 underline">Senha, privacidade e exclusão</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
