"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold text-sage-900">Algo deu errado</h1>
      <p className="mt-2 max-w-md text-sage-700">Não foi possível carregar esta página agora. Tente novamente em instantes.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Tentar novamente</Button>
        <Button asChild variant="outline"><Link href="/">Página inicial</Link></Button>
      </div>
    </main>
  );
}
