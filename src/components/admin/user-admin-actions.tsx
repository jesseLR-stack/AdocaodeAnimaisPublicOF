"use client";

import { adminSetUserStatus, adminSetVerified } from "@/app/actions/admin";
import { ReasonAction } from "./reason-action";

export function UserAdminActions({
  user, canBlock, canVerify,
}: { user: { id: string; account_status: string; is_verified: boolean; full_name: string }; canBlock: boolean; canVerify: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {user.account_status === "ativo" ? (
        <>
          <ReasonAction label="Suspender conta" title={`Suspender ${user.full_name}`} variant="destructive"
            description="Anúncios saem do ar e a pessoa não poderá publicar nem enviar mensagens até ser reativada."
            action={(r) => adminSetUserStatus(user.id, "suspenso", r)} />
          {canBlock && (
            <ReasonAction label="Bloquear conta" title={`Bloquear ${user.full_name}`} variant="destructive"
              description="Use para golpes ou abusos graves." action={(r) => adminSetUserStatus(user.id, "bloqueado", r)} />
          )}
        </>
      ) : (
        <ReasonAction label="Reativar conta" title={`Reativar ${user.full_name}`} variant="default" defaultReason="Conta reativada após análise"
          action={(r) => adminSetUserStatus(user.id, "ativo", r)} />
      )}
      {canVerify && (
        <ReasonAction
          label={user.is_verified ? "Remover verificação" : "Verificar perfil"}
          title={user.is_verified ? "Remover selo de verificado" : "Conceder selo de verificado"}
          description="O selo indica que a equipe confirmou que o perfil representa a organização ou protetor informado."
          requireReason={false}
          action={(r) => adminSetVerified(user.id, !user.is_verified, r)}
        />
      )}
    </div>
  );
}
