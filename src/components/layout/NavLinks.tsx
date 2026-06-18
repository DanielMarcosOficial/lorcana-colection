"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/minha-colecao", label: "Minha coleção" },
  { href: "/expansoes", label: "Expansões" },
  { href: "/busca", label: "Busca" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden md:flex items-center gap-0.5"
      aria-label="Navegação principal"
    >
      {links.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              active
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
