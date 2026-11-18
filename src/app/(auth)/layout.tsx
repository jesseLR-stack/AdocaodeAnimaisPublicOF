import Link from "next/link";
import { Heart } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { SITE_SLOGAN } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <main id="conteudo" className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit" aria-label="Voltar para a página inicial"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/termos" className="hover:underline">Termos</Link> · <Link href="/privacidade" className="hover:underline">Privacidade</Link> · <Link href="/contato" className="hover:underline">Ajuda</Link>
        </p>
      </main>
      <aside className="relative hidden overflow-hidden bg-sage-700 lg:block" aria-hidden>
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-sage-500/40" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-apricot-400/25" />
        <div className="relative flex h-full flex-col justify-center p-14">
          <div className="grid w-[420px] grid-cols-2 gap-4">
            {(["cachorro", "gato", "outro", "cachorro"] as const).map((s, i) => (
              <div key={i} className={`overflow-hidden rounded-[2rem] shadow-lift ring-8 ring-white/10 ${i % 2 ? "translate-y-10" : ""}`}>
                <AnimalIllustration species={s} seed={["Paçoca", "Mel", "Pipoca", "Thor"][i]} />
              </div>
            ))}
          </div>
          <p className="mt-20 max-w-sm font-display text-4xl leading-tight font-semibold text-cream-100">{SITE_SLOGAN}</p>
          <p className="mt-4 flex items-center gap-2 text-sage-100">
            <Heart className="size-4 fill-apricot-300 text-apricot-300" /> Gratuito para adotantes, protetores e ONGs.
          </p>
        </div>
      </aside>
    </div>
  );
}
