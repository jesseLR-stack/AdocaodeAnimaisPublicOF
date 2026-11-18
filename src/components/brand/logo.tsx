import { cn } from "@/lib/utils";

/** Símbolo do AdoteAmigo: uma casa acolhendo um coração (lar + afeto). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <rect width="40" height="40" rx="13" fill="var(--sage-600)" />
      <path
        d="M9.5 19.2 19 11.3a1.6 1.6 0 0 1 2 0l9.5 7.9"
        fill="none" stroke="var(--cream-100)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M12.5 17.5v10a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-10"
        fill="none" stroke="var(--cream-100)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M20 27.2s-4.6-2.7-4.6-5.8a2.4 2.4 0 0 1 4.6-1 2.4 2.4 0 0 1 4.6 1c0 3.1-4.6 5.8-4.6 5.8Z"
        fill="var(--apricot-300)"
      />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      {!compact && (
        <span className="font-display text-[1.35rem] leading-none font-semibold tracking-tight text-sage-800">
          Adote<span className="text-apricot-500">Amigo</span>
        </span>
      )}
    </span>
  );
}
