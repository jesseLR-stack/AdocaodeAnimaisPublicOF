"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BadgeCheck, Flag, Gauge, Mail, PawPrint, ScrollText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: Gauge, perm: "dashboard.view", exact: true },
  { href: "/admin/denuncias", label: "Denúncias", icon: Flag, perm: "reports.manage", badge: "reports" },
  { href: "/admin/anuncios", label: "Anúncios", icon: PawPrint, perm: "animals.moderate", badge: "flagged" },
  { href: "/admin/usuarios", label: "Usuários", icon: Users, perm: "users.view" },
  { href: "/admin/verificacoes", label: "Verificações", icon: BadgeCheck, perm: "organizations.verify", badge: "verifications" },
  { href: "/admin/contatos", label: "Contatos", icon: Mail, perm: "reports.manage", badge: "contacts" },
  { href: "/admin/auditoria", label: "Auditoria", icon: ScrollText, perm: "logs.view" },
] as const;

export function AdminNav({ permissions, counts }: { permissions: string[]; counts: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
      {ITEMS.filter((i) => permissions.includes(i.perm)).map(({ href, label, icon: Icon, ...rest }) => {
        const active = "exact" in rest ? pathname === href : pathname.startsWith(href);
        const n = "badge" in rest ? counts[rest.badge] ?? 0 : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
              active ? "bg-cream-100 text-sage-900" : "text-sage-100 hover:bg-sage-700",
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{label}</span>
            {n > 0 && <span className="rounded-full bg-apricot-400 px-1.5 text-[11px] font-bold text-white">{n}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
