export function PageHeader({
  eyebrow, title, description, children,
}: { eyebrow?: string; title: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-paper">
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-20 size-80 rounded-full bg-sage-200/50 blur-3xl" />
      <div className="container-page relative py-12 sm:py-16">
        {eyebrow && <p className="text-sm font-bold tracking-wider text-apricot-500 uppercase">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-balance text-sage-900 sm:text-5xl">{title}</h1>
        {description && <div className="mt-4 max-w-2xl text-lg text-sage-700">{description}</div>}
        {children}
      </div>
    </section>
  );
}
