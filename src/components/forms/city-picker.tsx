"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { NativeSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BR_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type City = { id: number; name: string };
const cache = new Map<string, City[]>();

/** Seleção de estado e cidade (dados do IBGE armazenados no banco). */
export function CityPicker({
  defaultUf = "",
  defaultCityId,
  ufName = "uf",
  cityName = "city_id",
  required,
  error,
  allowAnyCity = false,
  onChange,
  className,
  compact = false,
}: {
  defaultUf?: string;
  defaultCityId?: number | null;
  ufName?: string;
  cityName?: string;
  required?: boolean;
  error?: string;
  allowAnyCity?: boolean;
  onChange?: (value: { uf: string; cityId: number | null }) => void;
  className?: string;
  compact?: boolean;
}) {
  const [uf, setUf] = useState(defaultUf);
  const [cityId, setCityId] = useState<string>(defaultCityId ? String(defaultCityId) : "");
  const [cities, setCities] = useState<City[]>(() => cache.get(defaultUf) ?? []);
  const [loading, setLoading] = useState(false);
  const ufRef = useRef<HTMLSelectElement>(null);
  const cityRef = useRef<HTMLSelectElement>(null);
  const latest = useRef({ uf, cityId });
  latest.current = { uf, cityId };

  // React 19 redefine formulários após uma Server Action; restauramos a seleção atual.
  useEffect(() => {
    const form = ufRef.current?.form;
    if (!form) return;
    const restore = () =>
      requestAnimationFrame(() => {
        if (ufRef.current) ufRef.current.value = latest.current.uf;
        if (cityRef.current) cityRef.current.value = latest.current.cityId;
      });
    form.addEventListener("reset", restore);
    return () => form.removeEventListener("reset", restore);
  }, []);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    if (cache.has(uf)) {
      setCities(cache.get(uf)!);
      return;
    }
    let active = true;
    setLoading(true);
    createClient()
      .from("cities").select("id, name").eq("uf", uf).order("name")
      .then(({ data }) => {
        if (!active) return;
        cache.set(uf, data ?? []);
        setCities(data ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uf]);

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-[96px_1fr]" : "sm:grid-cols-[160px_1fr]", className)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${ufName}-select`} className={compact ? "sr-only" : undefined}>
          Estado{required && <span className="text-apricot-500"> *</span>}
        </Label>
        <NativeSelect
          ref={ufRef}
          id={`${ufName}-select`}
          name={ufName}
          value={uf}
          required={required}
          aria-invalid={!!error && !uf}
          onChange={(e) => {
            setUf(e.target.value);
            setCityId("");
            onChange?.({ uf: e.target.value, cityId: null });
          }}
        >
          <option value="">{compact ? "UF" : "Selecione"}</option>
          {BR_STATES.map(([code, name]) => (
            <option key={code} value={code}>{compact ? code : `${code} — ${name}`}</option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${cityName}-select`} className={compact ? "sr-only" : undefined}>
          Cidade{required && <span className="text-apricot-500"> *</span>}
        </Label>
        <NativeSelect
          ref={cityRef}
          id={`${cityName}-select`}
          name={cityName}
          value={cityId}
          required={required}
          disabled={!uf || loading}
          aria-invalid={!!error}
          onChange={(e) => {
            setCityId(e.target.value);
            onChange?.({ uf, cityId: e.target.value ? Number(e.target.value) : null });
          }}
        >
          <option value="">
            {!uf ? "Escolha o estado primeiro" : loading ? "Carregando cidades…" : allowAnyCity ? "Todas as cidades" : "Selecione a cidade"}
          </option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </NativeSelect>
      </div>
      {error && <p className="text-sm font-medium text-destructive sm:col-span-2" role="alert">{error}</p>}
    </div>
  );
}
