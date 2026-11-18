import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="py-2" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-[1.75rem]" />)}
      </div>
    </div>
  );
}
