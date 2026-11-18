"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2 } from "lucide-react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import { setAvatar } from "@/app/actions/account";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials, storageUrl } from "@/lib/format";

export function AvatarUpload({ userId, name, current }: { userId: string; name: string; current: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(storageUrl(current, { bucket: "avatars" }));

  async function onFile(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return void toast.error("Use JPG, PNG ou WebP.");
    if (file.size > 10 * 1024 * 1024) return void toast.error("A imagem deve ter até 10 MB.");
    setBusy(true);
    try {
      const out = await imageCompression(file, { maxWidthOrHeight: 400, maxSizeMB: 0.2, fileType: "image/webp", useWebWorker: true });
      const path = `${userId}/avatar-${crypto.randomUUID()}.webp`;
      const { error } = await createClient().storage.from("avatars").upload(path, out, { contentType: "image/webp" });
      if (error) throw error;
      const res = await setAvatar(path);
      if (!res.ok) throw new Error(res.error);
      setPreview(URL.createObjectURL(out));
      toast.success("Foto atualizada!");
      router.refresh();
    } catch {
      toast.error("Não foi possível enviar a foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      <Avatar className="size-24 ring-8 ring-sage-50">
        {preview && <AvatarImage src={preview} alt="Sua foto de perfil" />}
        <AvatarFallback className="text-2xl">{initials(name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        <Button type="button" variant="outline" size="sm" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Camera />} {preview ? "Trocar foto" : "Adicionar foto"}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={async () => {
            const res = await setAvatar(null);
            if (res.ok) { setPreview(null); router.refresh(); }
          }}>
            <Trash2 /> Remover
          </Button>
        )}
        <p className="text-xs text-muted-foreground">Opcional. JPG, PNG ou WebP.</p>
      </div>
    </div>
  );
}
