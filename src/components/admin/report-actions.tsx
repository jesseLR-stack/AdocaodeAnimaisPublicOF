"use client";

import { adminSetAnimalStatus, adminSetUserStatus, adminUpdateReport } from "@/app/actions/admin";
import { ReasonAction } from "./reason-action";

export function ReportActions({ id, status, animalId, userId }: { id: string; status: string; animalId: string | null; userId: string | null }) {
  const open = status === "pendente" || status === "em_analise";
  return (
    <div className="flex flex-wrap gap-2">
      {status === "pendente" && (
        <ReasonAction label="Iniciar análise" title="Marcar como em análise" requireReason={false} action={(r) => adminUpdateReport(id, "em_analise", r)} />
      )}
      {open && (
        <>
          <ReasonAction label="Procedente" title="Denúncia procedente" description="Lembre-se de aplicar a medida no conteúdo ou na conta." variant="default"
            action={(r) => adminUpdateReport(id, "procedente", r)} />
          <ReasonAction label="Improcedente" title="Denúncia improcedente" variant="ghost" action={(r) => adminUpdateReport(id, "improcedente", r)} />
        </>
      )}
      {animalId && (
        <ReasonAction label="Suspender anúncio" title="Suspender anúncio" variant="destructive" defaultReason="Violação das diretrizes da comunidade"
          action={(r) => adminSetAnimalStatus(animalId, "suspenso", r)} />
      )}
      {userId && (
        <ReasonAction label="Suspender conta" title="Suspender conta do denunciado" variant="destructive"
          description="A conta não poderá publicar nem enviar mensagens, e os anúncios saem do ar."
          action={(r) => adminSetUserStatus(userId, "suspenso", r)} />
      )}
    </div>
  );
}
