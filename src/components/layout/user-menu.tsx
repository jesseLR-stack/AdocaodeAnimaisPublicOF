"use client";

import Link from "next/link";
import {
  Heart, LayoutDashboard, LogOut, MessageCircle, PawPrint, Settings, ShieldCheck, User,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, storageUrl } from "@/lib/format";
import { signOut } from "@/app/actions/auth";

export function UserMenu({ name, avatarUrl, isStaff }: { name: string; avatarUrl: string | null; isStaff: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hidden cursor-pointer rounded-full outline-none focus-visible:ring-4 focus-visible:ring-sage-200 md:block"
        aria-label="Menu da conta"
      >
        <Avatar className="size-10 ring-sage-200">
          {avatarUrl && <AvatarImage src={storageUrl(avatarUrl, { bucket: "avatars" }) ?? undefined} alt="" />}
          <AvatarFallback>{initials(name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Olá, <span className="font-semibold text-sage-900">{name.split(" ")[0]}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem asChild><Link href="/painel"><LayoutDashboard /> Meu painel</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/painel/anuncios"><PawPrint /> Meus anúncios</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/painel/favoritos"><Heart /> Favoritos</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/painel/conversas"><MessageCircle /> Conversas</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/painel/perfil"><User /> Meu perfil</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link href="/painel/configuracoes"><Settings /> Configurações</Link></DropdownMenuItem>
        {isStaff && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/admin"><ShieldCheck /> Administração</Link></DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <form action={signOut}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full"><LogOut /> Sair</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
