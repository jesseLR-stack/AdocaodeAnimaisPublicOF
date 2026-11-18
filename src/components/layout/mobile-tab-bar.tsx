"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, MessageCircle, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Início", icon: Home, match: (p: string) => p === "/" },
  { href: "/animais", label: "Buscar", icon: Search, match: (p: string) => p.startsWith("/animais") },
  { href: "/painel/anuncios/novo", label: "Anunciar", icon: Plus, match: (p: string) => p === "/painel/anuncios/novo", primary: true },
  { href: "/painel/favoritos", label: "Favoritos", icon: Heart, match: (p: string) => p.startsWith("/painel/favoritos") },
  { href: "/painel/conversas", label: "Conversas", icon: MessageCircle, match: (p: string) => p.startsWith("/painel/conversas") },
];

/** Navegação inferior fixa, pensada para uso com o polegar em celulares. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/92 backdrop-blur-xl md:hidden pb-safe"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5 px-2 pt-1.5">
        {TABS.map(({ href, label, icon: Icon, match, primary }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-[11px] font-semibold text-sage-600 transition",
                  active && "text-sage-900",
                )}
              >
                {primary ? (
                  <span className="-mt-5 flex size-12 items-center justify-center rounded-full bg-apricot-400 text-white shadow-lift ring-4 ring-white transition active:scale-95">
                    <Icon className="size-6" strokeWidth={2.5} />
                  </span>
                ) : (
                  <span className={cn("flex h-8 w-12 items-center justify-center rounded-full transition", active && "bg-sage-100")}>
                    <Icon className="size-[22px]" strokeWidth={active ? 2.5 : 2} />
                  </span>
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
