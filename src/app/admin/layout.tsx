import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: { default: "Administração", template: "%s · Admin AdoteAmigo" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/admin");
  if (!user.staffRole) redirect("/painel");
  const supabase = await createClient();
  const { data: stats } = await supabase.rpc("admin_dashboard_stats");
  const s = (stats ?? {}) as Record<string, number>;
  const { count: contacts } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).is("handled_at", null);

  return (
    <div className="min-h-dvh bg-cream-100 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-sage-800 p-4 text-white lg:sticky lg:top-0 lg:h-dvh lg:p-5">
        <div className="mb-4 flex items-center justify-between lg:mb-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">AdoteAmigo</span>
              <span className="flex items-center gap-1 text-xs text-apricot-200"><ShieldCheck className="size-3" /> {user.staffRole === "admin" ? "Administrador" : "Moderador"}</span>
            </span>
          </Link>
          <Link href="/painel" className="flex items-center gap-1 text-xs text-sage-200 hover:text-white lg:hidden"><ArrowLeft className="size-3" /> Sair</Link>
        </div>
        <AdminNav permissions={user.permissions} counts={{ reports: s.reports_open ?? 0, flagged: s.animals_flagged ?? 0, verifications: s.verifications_pending ?? 0, contacts: contacts ?? 0 }} />
        <Link href="/painel" className="mt-8 hidden items-center gap-2 text-sm text-sage-200 hover:text-white lg:flex"><ArrowLeft className="size-4" /> Voltar ao site</Link>
      </aside>
      <main id="conteudo" className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
