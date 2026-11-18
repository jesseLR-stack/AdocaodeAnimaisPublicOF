"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimalIllustration } from "@/components/brand/animal-illustration";
import { storageUrl } from "@/lib/format";
import { cn } from "@/lib/utils";

type Img = { id: string; storage_path: string; alt_text: string | null };

export function AnimalGallery({ images, name, species }: { images: Img[]; name: string; species: "cachorro" | "gato" | "outro" }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3.4] overflow-hidden rounded-[2rem] bg-cream-200 shadow-soft">
        <AnimalIllustration species={species} seed={name} />
        <p className="absolute bottom-3 left-3 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-sage-700">
          O anunciante ainda não enviou fotos
        </p>
      </div>
    );
  }

  const go = (i: number) => {
    const next = (i + images.length) % images.length;
    setIndex(next);
    track.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2rem] bg-cream-200 shadow-soft">
        <div
          ref={track}
          className="flex aspect-[4/3.4] snap-x snap-mandatory overflow-x-auto scrollbar-none"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== index) setIndex(i);
          }}
          aria-roledescription="carrossel"
          aria-label={`Fotos de ${name}`}
        >
          {images.map((img, i) => (
            <div key={img.id} className="relative size-full shrink-0 snap-start" aria-label={`Foto ${i + 1} de ${images.length}`}>
              <Image src={storageUrl(img.storage_path)!} alt={img.alt_text ?? `Foto de ${name}`} fill priority={i === 0} sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-soft transition hover:scale-105 sm:flex" aria-label="Foto anterior">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-soft transition hover:scale-105 sm:flex" aria-label="Próxima foto">
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur">
              {images.map((img, i) => (
                <span key={img.id} className={cn("size-2 rounded-full transition", i === index ? "w-5 bg-white" : "bg-white/60")} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
              className={cn("relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 transition sm:size-20", i === index ? "ring-sage-500" : "opacity-70 ring-transparent hover:opacity-100")}
            >
              <Image src={storageUrl(img.storage_path, { thumb: true })!} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
