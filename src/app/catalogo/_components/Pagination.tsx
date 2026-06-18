"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  function pageHref(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `/catalogo?${params.toString()}`;
  }

  const pages: (number | "…")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
  }

  const btnBase =
    "flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
  const active =
    "border-indigo-600 bg-indigo-600 text-white font-medium";
  const inactive =
    "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700";
  const disabled =
    "border-gray-200 bg-gray-50 text-gray-300 cursor-default dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600";

  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-center gap-1 py-6"
    >
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className={`${btnBase} ${inactive}`}>
          ‹
        </Link>
      ) : (
        <span className={`${btnBase} ${disabled}`}>‹</span>
      )}

      {pages.map((p, idx) =>
        p === "…" ? (
          <span key={`e-${idx}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(p as number)}
            className={`${btnBase} ${p === page ? active : inactive}`}
            aria-current={p === page ? "page" : undefined}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={pageHref(page + 1)} className={`${btnBase} ${inactive}`}>
          ›
        </Link>
      ) : (
        <span className={`${btnBase} ${disabled}`}>›</span>
      )}
    </nav>
  );
}
