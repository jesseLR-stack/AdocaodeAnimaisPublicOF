import Image from "next/image";
import Link from "next/link";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { Badge } from "@/components/ui/badge";
import { INTEREST_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime, storageUrl } from "@/lib/format";

const TONE: Record<string, "default" | "success" | "warning" | "danger" | "outline" | "accent"> = {
  enviado: "accent", visualizado: "default", em_conversa: "default", aceito: "success", recusado: "outline", cancelado: "outline",
};

export function InterestCard({
  animal, person, status, message, housing, createdAt, ownerNote, actions,
}: {
  animal: { name: string; slug: string; species: "cachorro" | "gato" | "outro"; image: string | null } | null;
  person: { label: string; name: string } | null;
  status: keyof typeof INTEREST_STATUS_LABEL;
  message: string;
  housing?: string | null;
  createdAt: string;
  ownerNote?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <li className="rounded-3xl bg-white p-4 ring-1 ring-border/60 sm:p-5">
      <div className="flex gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-cream-200 sm:size-20">
          {animal?.image ? <Image src={storageUrl(animal.image, { thumb: true })!} alt="" fill sizes="80px" className="object-cover" /> : <AnimalIllustration species={animal?.species ?? "cachorro"} seed={animal?.name} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {animal ? <Link href={`/animais/${animal.slug}`} className="font-display text-lg font-semibold text-sage-900 hover:underline">{animal.name}</Link> : <span className="font-semibold">Anúncio indisponível</span>}
            <Badge variant={TONE[status]}>{INTEREST_STATUS_LABEL[status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{person && <>{person.label}: <strong className="text-sage-800">{person.name}</strong> · </>}{formatDateTime(createdAt)}</p>
          <p className="mt-2 whitespace-pre-line text-sage-800">“{message}”</p>
          {housing && <p className="mt-1 text-sm text-sage-700"><strong>Moradia:</strong> {housing}</p>}
          {ownerNote && <p className="mt-2 rounded-xl bg-cream-100 p-2 text-sm text-sage-800"><strong>Resposta:</strong> {ownerNote}</p>}
          {actions && <div className="mt-3">{actions}</div>}
        </div>
      </div>
    </li>
  );
}
