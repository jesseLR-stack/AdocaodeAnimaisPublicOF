import Link from "next/link";
import { Bell, Heart, Inbox, MessageCircle, PawPrint, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABEL } from "@/lib/constants";
import { timeAgo } from "@/lib/format";

export default async function PainelPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const supabase = await createClient();
  const [animals, favorites, received, sent, unread, notifications] = await Promise.all([
    supabase.from("animals").select("id, name, slug, status, view_count, created_at").eq("owner_id", user.id).order("created_at", { ascending: false }),
    supabase.from("favorites").select("animal_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("adoption_interests").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "enviado"),
    supabase.from("adoption_interests").select("id", { count: "exact", head: true }).eq("interested_id", user.id).neq("status", "cancelado"),
    supabase.rpc("unread_messages_count"),
    supabase.from("notifications").select("id, title, body, link, read_at, created_at").order("created_at", { ascending: false }).limit(5),
  ]);
  const list = animals.data ?? [];
  const stats = [
    { label: "Anúncios ativos", value: list.filter((a) => a.status === "disponivel").length, icon: PawPrint, href: "/painel/anuncios" },
    { label: "Adotados", value: list.filter((a) => a.status === "adotado").length, icon: Sparkles, href: "/painel/anuncios" },
    { label: "Interesses novos", value: received.count ?? 0, icon: Inbox, href: "/painel/interesses/recebidos" },
    { label: "Mensagens não lidas", value: Number(unread.data ?? 0), icon: MessageCircle, href: "/painel/conversas" },
    { label: "Favoritos", value: favorites.count ?? 0, icon: Heart, href: "/painel/favoritos" },
    { label: "Interesses enviados", value: sent.count ?? 0, icon: Search, href: "/painel/interesses/enviados" },
  ];

  return (
    <div className="space-y-8">
      {sp["bem-vindo"] && (
        <div className="rounded-3xl bg-sage-600 p-6 text-white">
          <p className="font-display text-2xl font-semibold">Bem-vindo(a) ao AdoteAmigo! 🐾</p>
          <p className="mt-1 text-sage-100">Sua conta está ativa. Complete seu perfil com uma foto para transmitir mais confiança.</p>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground">Olá,</p>
          <h1 className="text-3xl font-semibold text-sage-900 sm:text-4xl">{user.profile.full_name.split(" ")[0]} 👋</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/animais"><Search /> Buscar animais</Link></Button>
          <Button asChild variant="accent"><Link href="/painel/anuncios/novo"><Plus /> Novo anúncio</Link></Button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <li key={label}>
            <Link href={href} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-soft ring-1 ring-border/60 transition hover:-translate-y-0.5 hover:shadow-lift sm:p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700"><Icon className="size-5" /></span>
              <span>
                <span className="block font-display text-2xl leading-none font-semibold text-sage-900">{value}</span>
                <span className="text-xs font-semibold text-muted-foreground sm:text-sm">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-border/60 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-sage-900">Meus anúncios</h2>
            <Link href="/painel/anuncios" className="text-sm font-semibold text-sage-700 hover:underline">Ver todos</Link>
          </div>
          {list.length === 0 ? (
            <p className="text-muted-foreground">Você ainda não publicou nenhum animal. <Link href="/painel/anuncios/novo" className="font-semibold text-sage-700 underline">Criar meu primeiro anúncio</Link></p>
          ) : (
            <ul className="divide-y divide-border">
              {list.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <Link href={`/animais/${a.slug}`} className="font-semibold text-sage-900 hover:underline">{a.name}</Link>
                  <span className="flex items-center gap-3 text-sm text-muted-foreground">
                    {a.view_count} visitas
                    <Badge variant={a.status === "disponivel" ? "success" : a.status === "adotado" ? "dark" : "warning"}>{STATUS_LABEL[a.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-3xl bg-white p-5 ring-1 ring-border/60 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-sage-900">Atividade recente</h2>
            <Link href="/painel/notificacoes" className="text-sm font-semibold text-sage-700 hover:underline">Ver todas</Link>
          </div>
          {(notifications.data?.length ?? 0) === 0 ? (
            <p className="flex items-center gap-2 text-muted-foreground"><Bell className="size-4" /> Nenhuma notificação por enquanto.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.data!.map((n) => (
                <li key={n.id}>
                  <Link href={n.link ?? "/painel/notificacoes"} className="flex gap-3 rounded-2xl p-2 hover:bg-cream-100">
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.read_at ? "bg-beige-300" : "bg-apricot-400"}`} />
                    <span>
                      <span className="block font-semibold text-sage-900">{n.title}</span>
                      <span className="block text-sm text-muted-foreground">{timeAgo(n.created_at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
