"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface CardSetOption {
  code: string;
  name: string;
}

interface CatalogFiltersProps {
  sets: CardSetOption[];
  inks: string[];
  rarities: string[];
  types: string[];
  showOwnershipFilter?: boolean;
  currentValues: {
    q: string;
    setCode: string;
    ink: string;
    rarity: string;
    type: string;
    cost: string;
    hasPriceUsd: string;
    hasPriceUsdFoil: string;
    sortBy: string;
    ownership: string;
  };
}

const OWNERSHIP_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "owned", label: "Possuo" },
  { value: "not_owned", label: "Não possuo" },
  { value: "owned_normal", label: "Possuo (normal)" },
  { value: "owned_foil", label: "Possuo (foil)" },
  { value: "owned_both", label: "Possuo (ambas)" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Nome (A–Z)" },
  { value: "collectorNumber", label: "Número" },
  { value: "releasedAt", label: "Lançamento" },
  { value: "priceAsc", label: "Menor preço" },
  { value: "priceDesc", label: "Maior preço" },
  { value: "rarity", label: "Raridade" },
];

export function CatalogFilters({
  sets,
  inks,
  rarities,
  types,
  currentValues,
  showOwnershipFilter = false,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/catalogo?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push("/catalogo");
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-navy-600 dark:bg-navy-750 dark:text-slate-100 dark:placeholder:text-navy-400";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600 dark:text-navy-300";

  return (
    <aside
      className={`flex flex-col gap-4 transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div>
        <label className={labelClass}>Busca</label>
        <input
          type="search"
          defaultValue={currentValues.q}
          placeholder="Nome, versão, número…"
          className={inputClass}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              updateParam("q", (e.target as HTMLInputElement).value);
            }
          }}
          onBlur={(e) => updateParam("q", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Ordenar por</label>
        <select
          value={currentValues.sortBy}
          className={inputClass}
          onChange={(e) => updateParam("sortBy", e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Expansão</label>
        <select
          value={currentValues.setCode}
          className={inputClass}
          onChange={(e) => updateParam("setCode", e.target.value)}
        >
          <option value="">Todas</option>
          {sets.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Tinta</label>
        <select
          value={currentValues.ink}
          className={inputClass}
          onChange={(e) => updateParam("ink", e.target.value)}
        >
          <option value="">Todas</option>
          {inks.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Raridade</label>
        <select
          value={currentValues.rarity}
          className={inputClass}
          onChange={(e) => updateParam("rarity", e.target.value)}
        >
          <option value="">Todas</option>
          {rarities.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Tipo</label>
        <select
          value={currentValues.type}
          className={inputClass}
          onChange={(e) => updateParam("type", e.target.value)}
        >
          <option value="">Todos</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Custo</label>
        <select
          value={currentValues.cost}
          className={inputClass}
          onChange={(e) => updateParam("cost", e.target.value)}
        >
          <option value="">Qualquer</option>
          {Array.from({ length: 11 }, (_, i) => i).map((c) => (
            <option key={c} value={String(c)}>{c}</option>
          ))}
          <option value="11">11+</option>
        </select>
      </div>

      {showOwnershipFilter && (
        <div>
          <label className={labelClass}>Coleção</label>
          <select
            value={currentValues.ownership}
            className={inputClass}
            onChange={(e) => updateParam("ownership", e.target.value)}
          >
            {OWNERSHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={currentValues.hasPriceUsd === "1"}
            onChange={(e) => updateParam("hasPriceUsd", e.target.checked ? "1" : "")}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Com preço normal
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={currentValues.hasPriceUsdFoil === "1"}
            onChange={(e) => updateParam("hasPriceUsdFoil", e.target.checked ? "1" : "")}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Com preço foil
        </label>
      </div>

      <button
        onClick={clearAll}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-navy-600 dark:text-navy-300 dark:hover:bg-navy-700 transition-colors"
      >
        Limpar filtros
      </button>
    </aside>
  );
}
