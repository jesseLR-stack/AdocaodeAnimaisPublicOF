"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell, Heart, Inbox, LayoutDashboard, MessageCircle, PawPrint, PlusCircle, Send, Settings, ShieldCheck, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/painel/anuncios", label: "Meus anúncios", icon: PawPrint },
  { href: "/painel/anuncios/novo", label: "Criar anúncio", icon: PlusCircle, exact: true },
  { href: "/painel/favoritos", label: "Favoritos", icon: Heart },
  { href: "/painel/interesses/enviados", label: "Interesses enviados", icon: Send },
  { href: "/painel/interesses/recebidos", label: "Interesses recebidos", icon: Inbox, badge: "interests" },
  { href: "/painel/conversas", label: "Conversas", icon: MessageCircle, badge: "messages" },
  { href: "/painel/notificacoes", label: "Notificações", icon: Bell, badge: "notifications" },
  { href: "/painel/perfil", label: "Meu perfil", icon: User },
  { href: "/painel/configuracoes", label: "Configurações e privacidade", icon: Settings },
] as const;

export function DashboardNav({
  counts, isStaff,
}: { counts: { interests: number; messages: number; notifications: number }; isStaff: boolean }) {
  const pathname = usePathname();
  const mobileNav = useRef<HTMLElement>(null);
  useEffect(() => {
    mobileNav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(`${href}/`) && !(href === "/painel/anuncios" && pathname === "/painel/anuncios/novo"));

  const link = (item: (typeof ITEMS)[number], mobile = false) => {
    const active = isActive(item.href, "exact" in item ? item.exact : false);
    const n = "badge" in item ? counts[item.badge] : 0;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-2xl font-semibold transition",
          mobile ? "shrink-0 px-3.5 py-2 text-sm whitespace-nowrap" : "px-3.5 py-2.5 text-[15px]",
          active ? "bg-sage-600 text-white shadow-soft" : "text-sage-700 hover:bg-sage-100",
        )}
      >
        <Icon className="size-[18px] shrink-0" />
        <span className={mobile ? "" : "flex-1"}>{item.label}</span>
        {n > 0 && (
          <span className={cn("flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold", active ? "bg-white text-sage-700" : "bg-apricot-400 text-white")}>
            {n > 99 ? "99+" : n}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      <nav ref={mobileNav} aria-label="Painel" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none lg:hidden">
        {ITEMS.map((i) => link(i, true))}
      </nav>
      <nav aria-label="Painel" className="hidden flex-col gap-1 lg:flex">
        {ITEMS.map((i) => link(i))}
        {isStaff && (
          <Link href="/admin" className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-dashed border-sage-300 px-3.5 py-2.5 text-[15px] font-semibold text-sage-700 hover:bg-sage-50">
            <ShieldCheck className="size-[18px]" /> Administração
          </Link>
        )}
      </nav>
    </>
  );
}
