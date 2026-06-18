"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/common/Avatar";
import type { SessionUser } from "@/lib/auth/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/minha-colecao", label: "Minha coleção" },
  { href: "/expansoes", label: "Expansões" },
  { href: "/busca", label: "Busca" },
];

interface NavbarMobileProps {
  user: SessionUser;
}

export function NavbarMobile({ user }: NavbarMobileProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        {open ? (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute left-0 right-0 top-16 z-40 border-b border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-navy-600 dark:bg-navy-800 md:hidden"
        >
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-navy-700">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} size="md" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5" aria-label="Navegação mobile">
            {links.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-700"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-navy-700 flex flex-col gap-0.5">
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Meu perfil
            </Link>
            <Link
              href="/configuracoes"
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Configurações
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-slate-50 dark:text-red-400 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
