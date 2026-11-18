"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeaderNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative rounded-full px-3.5 py-2 text-[15px] font-semibold text-sage-700 transition-colors hover:bg-sage-100/70 hover:text-sage-900",
        active && "bg-sage-100 text-sage-900",
      )}
    >
      {children}
    </Link>
  );
}
