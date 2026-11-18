"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/app/actions/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  animalId,
  initial,
  isLoggedIn,
  variant = "floating",
  className,
}: {
  animalId: string;
  initial: boolean;
  isLoggedIn: boolean;
  variant?: "floating" | "full";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(initial);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast("Entre para salvar favoritos", {
        action: { label: "Entrar", onClick: () => router.push(`/entrar?redirect=${encodeURIComponent(pathname)}`) },
      });
      return;
    }
    const next = !fav;
    startTransition(async () => {
      setFav(next);
      const res = await toggleFavorite({ animalId, favorite: next });
      if (!res.ok) {
        toast.error(res.error === "login" ? "Sua sessão expirou. Entre novamente." : res.error);
        return;
      }
      toast.success(next ? "Adicionado aos favoritos" : "Removido dos favoritos");
      router.refresh();
    });
  }

  const label = fav ? "Remover dos favoritos" : "Adicionar aos favoritos";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={fav}
        disabled={pending}
        className={cn(
          "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-5 text-sm font-semibold transition active:scale-[0.97]",
          fav ? "border-apricot-300 bg-apricot-100 text-apricot-600" : "border-sage-200 bg-white text-sage-800 hover:border-apricot-300",
          className,
        )}
      >
        <Heart key={String(fav)} className={cn("size-5", fav && "animate-pop fill-apricot-500 text-apricot-500")} />
        {fav ? "Favoritado" : "Favoritar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={fav}
      aria-label={label}
      title={label}
      disabled={pending}
      className={cn(
        "flex size-10 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-110 active:scale-95",
        className,
      )}
    >
      <Heart
        key={String(fav)}
        className={cn("size-5 transition", fav ? "animate-pop fill-apricot-500 text-apricot-500" : "text-sage-700")}
      />
    </button>
  );
}
