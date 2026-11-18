import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, MapPin } from "lucide-react";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { Badge } from "@/components/ui/badge";
import { AGE_LABEL, SEX_LABEL, SIZE_LABEL } from "@/lib/constants";
import { storageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AnimalCardData } from "@/lib/data/animals";
import { FavoriteButton } from "./favorite-button";

type CardAnimal = Pick<
  AnimalCardData,
  "id" | "slug" | "name" | "species" | "breed" | "age_group" | "sex" | "size" | "city_name" | "uf" |
  "image_path" | "status" | "special_needs" | "owner_verified"
> & { distance_km?: number | null; species_other?: string | null };

export function AnimalCard({
  animal,
  isFavorite = false,
  isLoggedIn = false,
  priority = false,
  className,
}: {
  animal: CardAnimal;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const img = storageUrl(animal.image_path, { thumb: true });
  const adopted = animal.status === "adotado";
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-soft ring-1 ring-border/60 transition duration-300 hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
    >
      <div className="relative aspect-[4/3.6] overflow-hidden bg-cream-200">
        {img ? (
          <Image
            src={img}
            alt={`Foto de ${animal.name}`}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <AnimalIllustration species={animal.species} seed={animal.name} className="transition duration-500 group-hover:scale-[1.04]" />
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {adopted && <Badge variant="dark">Adotado ♥</Badge>}
          {animal.special_needs && !adopted && <Badge variant="accent">Cuidados especiais</Badge>}
        </div>
        {!adopted && (
          <FavoriteButton
            animalId={animal.id}
            initial={isFavorite}
            isLoggedIn={isLoggedIn}
            className="absolute top-3 right-3 z-10"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-xl leading-tight font-semibold text-sage-900">
            <Link href={`/animais/${animal.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {animal.name}
            </Link>
          </h3>
          {animal.owner_verified && (
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-sage-500" aria-label="Anunciante verificado" />
          )}
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {animal.breed || animal.species_other || (animal.species === "cachorro" ? "Sem raça definida" : animal.species === "gato" ? "Sem raça definida" : "Animal")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="cream">{SEX_LABEL[animal.sex]}</Badge>
          <Badge variant="cream">{AGE_LABEL[animal.age_group]}</Badge>
          <Badge variant="cream">Porte {SIZE_LABEL[animal.size].toLowerCase()}</Badge>
        </div>
        <p className="mt-auto flex items-center gap-1 pt-1 text-sm font-medium text-sage-700">
          <MapPin className="size-4 shrink-0 text-apricot-500" />
          <span className="truncate">{animal.city_name}, {animal.uf}</span>
          {animal.distance_km != null && (
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">~{Math.max(1, Math.round(animal.distance_km))} km</span>
          )}
        </p>
      </div>
    </article>
  );
}

export function AnimalGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4", className)}>{children}</div>
  );
}
