"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { signOut } from "@/app/actions/auth";
import { MAIN_NAV } from "./nav-links";

const EXTRA = [
  { href: "/adocao-responsavel", label: "Adoção responsável" },
  { href: "/contato", label: "Contato" },
];

export function MobileMenu({ isLoggedIn, isStaff }: { isLoggedIn: boolean; isStaff: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-6">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navegação do site</SheetDescription>
        <Logo />
        <nav className="mt-4 flex flex-col gap-1" aria-label="Menu móvel">
          {[...MAIN_NAV, ...EXTRA].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className="rounded-2xl px-4 py-3 text-lg font-semibold text-sage-800 transition hover:bg-sage-100"
            >
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link href="/admin" onClick={close} className="rounded-2xl px-4 py-3 text-lg font-semibold text-sage-800 hover:bg-sage-100">
              Administração
            </Link>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Button asChild variant="accent" size="lg" onClick={close}>
            <Link href="/painel/anuncios/novo">Anunciar um animal</Link>
          </Button>
          {isLoggedIn ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="lg" className="w-full">Sair da conta</Button>
            </form>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="lg" onClick={close}><Link href="/entrar">Entrar</Link></Button>
              <Button asChild size="lg" onClick={close}><Link href="/cadastrar">Cadastrar</Link></Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
