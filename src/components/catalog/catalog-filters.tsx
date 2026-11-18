"use client";

import { useEffect, useState } from "react";
import { Cat, Dog, LocateFixed, Rabbit, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CityPicker } from "@/components/forms/city-picker";
import { AGE_HINT, AGE_LABEL, RADIUS_OPTIONS, SIZE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useCatalogParams } from "./use-catalog-params";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition active:scale-95",
        active ? "border-sage-600 bg-sage-600 text-white" : "border-input bg-white text-sage-800 hover:border-sage-300",
      )}
    >
      {children}
    </button>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `fg-${title.normalize("NFD").replace(/[^a-z]/gi, "").toLowerCase()}`;
  return (
    <div role="group" aria-labelledby={id} className="border-b border-border/70 py-5 first:pt-0 last:border-0">
      <p id={id} className="mb-3 text-sm font-bold text-sage-900">{title}</p>
      {children}
    </div>
  );
}

function TriState({ name, label }: { name: string; label: string }) {
  const { params, update } = useCatalogParams();
  const value = params.get(name) ?? "";
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={`f-${name}`} className="font-medium">{label}</Label>
      <NativeSelect id={`f-${name}`} value={value} onChange={(e) => update({ [name]: e.target.value })} className="h-10 w-32 text-sm">
        <option value="">Tanto faz</option>
        <option value="sim">Sim</option>
        <option value="nao">Não</option>
      </NativeSelect>
    </div>
  );
}

export function CatalogFilters({ userCity }: { userCity?: { id: number; uf: string } | null }) {
  const { params, update, list, toggle, clear } = useCatalogParams();
  const [breed, setBreed] = useState(params.get("raca") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("raca") ?? "") !== breed) update({ raca: breed.trim() || null });
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breed]);

  const species = list("especie");
  const ref = params.get("ref");
  const hasLocation = params.get("uf") || params.get("cidade");

  return (
    <div>
      <Group title="Espécie">
        <div className="flex flex-wrap gap-2">
          <Chip active={species.includes("cachorro")} onClick={() => toggle("especie", "cachorro")}><Dog className="size-4" /> Cães</Chip>
          <Chip active={species.includes("gato")} onClick={() => toggle("especie", "gato")}><Cat className="size-4" /> Gatos</Chip>
          <Chip active={species.includes("outro")} onClick={() => toggle("especie", "outro")}><Rabbit className="size-4" /> Outros</Chip>
        </div>
      </Group>

      <Group title="Idade">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(AGE_LABEL).map(([value, label]) => (
            <Chip key={value} active={list("idade").includes(value)} onClick={() => toggle("idade", value)}>
              <span className="flex flex-col items-start leading-tight">
                {label}
                <span className="text-[11px] font-medium opacity-75">{AGE_HINT[value as keyof typeof AGE_HINT]}</span>
              </span>
            </Chip>
          ))}
        </div>
      </Group>

      <Group title="Sexo">
        <div className="flex flex-wrap gap-2">
          {[["", "Todos"], ["macho", "Macho"], ["femea", "Fêmea"]].map(([value, label]) => (
            <Chip key={value} active={(params.get("sexo") ?? "") === value} onClick={() => update({ sexo: value })}>{label}</Chip>
          ))}
        </div>
      </Group>

      <Group title="Porte">
        <div className="flex flex-wrap gap-2">
          {Object.entries(SIZE_LABEL).map(([value, label]) => (
            <Chip key={value} active={list("porte").includes(value)} onClick={() => toggle("porte", value)}>{label}</Chip>
          ))}
        </div>
      </Group>

      <Group title="Raça">
        <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="Ex.: labrador, siamês" className="h-11" aria-label="Raça" />
      </Group>

      <Group title="Localização">
        <CityPicker
          key={`${params.get("uf") ?? ""}-${params.get("cidade") ?? ""}`}
          ufName="f-uf"
          cityName="f-cidade"
          allowAnyCity
          defaultUf={params.get("uf") ?? ""}
          defaultCityId={params.get("cidade") ? Number(params.get("cidade")) : null}
          onChange={({ uf, cityId }) => update({ uf, cidade: cityId ? String(cityId) : null })}
          className="sm:grid-cols-1"
        />
      </Group>

      <Group title="Distância aproximada">
        <p className="mb-3 text-xs text-muted-foreground">
          Calculada entre o centro das cidades. Escolha a sua cidade de referência.
        </p>
        <CityPicker
          key={`ref-${ref ?? ""}`}
          ufName="f-ref-uf"
          cityName="f-ref"
          defaultUf={params.get("refuf") ?? ""}
          defaultCityId={ref ? Number(ref) : null}
          onChange={({ uf, cityId }) => update({ refuf: uf, ref: cityId ? String(cityId) : null, raio: params.get("raio") ?? (cityId ? "50" : null) })}
          className="sm:grid-cols-1"
        />
        {userCity && !ref && (
          <button
            type="button"
            onClick={() => update({ ref: String(userCity.id), refuf: userCity.uf, raio: "50" })}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
          >
            <LocateFixed className="size-4" /> Usar a cidade do meu perfil
          </button>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <Label htmlFor="f-raio" className="font-medium">Raio</Label>
          <NativeSelect id="f-raio" value={params.get("raio") ?? ""} disabled={!ref} onChange={(e) => update({ raio: e.target.value })} className="h-10 w-36 text-sm">
            <option value="">Qualquer</option>
            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>até {r} km</option>)}
          </NativeSelect>
        </div>
        {hasLocation && ref && (
          <p className="mt-2 text-xs text-warning">Dica: o filtro de cidade/estado e o de distância se combinam.</p>
        )}
      </Group>

      <Group title="Saúde e cuidados">
        <div className="space-y-3">
          <TriState name="castrado" label="Castrado" />
          <TriState name="vacinado" label="Vacinado" />
          <TriState name="especiais" label="Necessidades especiais" />
        </div>
      </Group>

      <button
        type="button"
        onClick={() => { setBreed(""); clear(); }}
        className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-sage-700 hover:underline"
      >
        <RotateCcw className="size-4" /> Limpar todos os filtros
      </button>
    </div>
  );
}
