export function DashHeader({ title, description, action }: { title: string; description?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-sage-900">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-12 text-center ring-1 ring-border/60">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-sage-100 text-sage-600 [&_svg]:size-8">{icon}</div>
      <p className="mt-4 font-display text-xl font-semibold text-sage-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
