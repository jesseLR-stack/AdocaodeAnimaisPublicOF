import Link from "next/link";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="conteudo" className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 text-center">
      <Link href="/" className="mb-10"><Logo /></Link>
      <div className="size-40 overflow-hidden rounded-full shadow-lift"><AnimalIllustration species="cachorro" seed="perdido" /></div>
      <h1 className="mt-8 text-4xl font-semibold text-sage-900">Ops, essa página fugiu!</h1>
      <p className="mt-2 max-w-md text-sage-700">Talvez o anúncio tenha sido removido ou o endereço esteja incorreto. Que tal procurar outros amigos?</p>
      <div className="mt-6 flex gap-3">
        <Button asChild size="lg"><Link href="/animais">Ver animais</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/">Página inicial</Link></Button>
      </div>
    </main>
  );
}
