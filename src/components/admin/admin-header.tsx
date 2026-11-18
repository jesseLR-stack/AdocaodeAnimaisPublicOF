export function AdminHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-sage-900">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export const ACTION_LABEL: Record<string, string> = {
  "animal.status": "Status do anúncio alterado",
  "animal.clear_flags": "Sinalizações revisadas",
  "animal.health_verified": "Saúde verificada",
  "animal.edit": "Anúncio editado",
  "user.status": "Status da conta alterado",
  "user.verify": "Perfil verificado",
  "user.unverify": "Verificação removida",
  "report.status": "Denúncia atualizada",
  "settings.update": "Configuração alterada",
  "contact.handled": "Contato atendido",
};
