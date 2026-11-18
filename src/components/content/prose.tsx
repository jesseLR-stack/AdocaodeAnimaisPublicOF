import { cn } from "@/lib/utils";

/** Tipografia para textos longos (páginas institucionais e legais). */
export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-3xl text-[17px] leading-relaxed text-sage-800",
        "[&_h2]:mt-12 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-sage-900",
        "[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-sage-900",
        "[&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6",
        "[&_a]:font-semibold [&_a]:text-sage-700 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-apricot-600",
        "[&_strong]:text-sage-900",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function LegalLayout({
  title, version, updated, children,
}: { title: string; version: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <section className="bg-paper">
        <div className="container-page py-12 sm:py-16">
          <p className="text-sm font-bold tracking-wider text-apricot-500 uppercase">Documento legal</p>
          <h1 className="mt-2 text-4xl font-semibold text-sage-900 sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground">Versão {version} · Atualizado em {updated}</p>
        </div>
      </section>
      <div className="container-page py-10">
        <div className="mb-8 max-w-3xl rounded-2xl bg-apricot-100 p-4 text-sm text-sage-800">
          <strong>Aviso:</strong> este documento foi elaborado para um projeto acadêmico. Antes de operar a
          plataforma comercialmente ou com grande volume de usuários, revise-o com um(a) advogado(a).
        </div>
        <Prose>{children}</Prose>
      </div>
    </>
  );
}
