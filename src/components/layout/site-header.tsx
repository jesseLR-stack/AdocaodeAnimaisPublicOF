import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAIN_NAV } from "./nav-links";
import { HeaderNavLink } from "./header-nav-link";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { NotificationBell } from "./notification-bell";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let unread = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
    unread = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-cream-100/85 backdrop-blur-xl supports-[backdrop-filter]:bg-cream-100/70">
      <div className="container-page flex h-16 items-center gap-4 lg:h-[72px]">
        <Link href="/" className="shrink-0 rounded-xl" aria-label="AdoteAmigo — página inicial">
          <Logo />
        </Link>

        <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => (
            <HeaderNavLink key={item.href} href={item.href}>{item.label}</HeaderNavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex" aria-label="Buscar animais">
            <Link href="/animais"><Search className="size-5" /></Link>
          </Button>
          <Button asChild variant="accent" size="sm" className="hidden md:inline-flex">
            <Link href="/painel/anuncios/novo"><Plus /> Anunciar animal</Link>
          </Button>
          {user ? (
            <>
              <NotificationBell userId={user.id} initialCount={unread} />
              <UserMenu
                name={user.profile.full_name}
                avatarUrl={user.profile.avatar_url}
                isStaff={Boolean(user.staffRole)}
              />
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm"><Link href="/entrar">Entrar</Link></Button>
              <Button asChild size="sm"><Link href="/cadastrar">Cadastrar</Link></Button>
            </div>
          )}
          <MobileMenu isLoggedIn={Boolean(user)} isStaff={Boolean(user?.staffRole)} />
        </div>
      </div>
    </header>
  );
}
