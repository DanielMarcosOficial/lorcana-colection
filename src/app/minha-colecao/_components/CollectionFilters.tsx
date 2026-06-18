"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface CardSetOption {
  code: string;
  name: string;
}

interface CollectionFiltersProps {
  sets: CardSetOption[];
  inks: string[];
  rarities: string[];
  currentValues: {
    q: string;
    setCode: string;
    ink: string;
    rarity: string;
    hasNormal: string;
    hasFoil: string;
    hasDuplicates: string;
    hasPrice: string;
    sortBy: string;
  };
}

const SORT_OPTIONS = [
  { value: "recentlyAdded", label: "Adicionadas recentemente" },
  { value: "name", label: "Nome (A–Z)" },
  { value: "set", label: "Expansão" },
  { value: "quantity", label: "Quantidade" },
  { value: "marketPrice", label: "Preço de mercado" },
  { value: "totalValue", label: "Valor total" },
];

export function CollectionFilters({ sets, inks, rarities, currentValues }: CollectionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      startTransition(() => {
        router.push(`/minha-colecao?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => router.push("/minha-colecao"));
  };

  const selectClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100";
  const labelClass = "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";

  return (
    <aside
      className={`flex flex-col gap-4 transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <div>
        <label className={labelClass}>Busca</label>
        <input
          type="search"
          defaultValue={currentValues.q}
          placeholder="Nome, versão…"
          className={selectClass}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParam("q", (e.target as HTMLInputElement).value);
          }}
          onBlur={(e) => updateParam("q", e.target.value)}
        />
      </div>

      <div>
        <label className={labelClass}>Ordenar por</label>
        <select
          value={currentValues.sortBy}
          className={selectClass}
          onChange={(e) => updateParam("sortBy", e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Expansão</label>
        <select
          value={currentValues.setCode}
          className={selectClass}
          onChange={(e) => updateParam("setCode", e.target.value)}
        >
          <option value="">Todas</option>
          {sets.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Tinta</label>
        <select
          value={currentValues.ink}
          className={selectClass}
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
          className={selectClass}
          onChange={(e) => updateParam("rarity", e.target.value)}
        >
          <option value="">Todas</option>
          {rarities.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { key: "hasNormal", label: "Tem normal" },
          { key: "hasFoil", label: "Tem foil" },
          { key: "hasDuplicates", label: "Apenas duplicatas" },
          { key: "hasPrice", label: "Com preço de compra" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={currentValues[key as keyof typeof currentValues] === "1"}
              onChange={(e) => updateParam(key, e.target.checked ? "1" : "")}
              className="rounded border-gray-300"
            />
            {label}
          </label>
        ))}
      </div>

      <button
        onClick={clearAll}
        className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        Limpar filtros
      </button>
    </aside>
  );
}
