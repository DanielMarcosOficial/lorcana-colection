"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "@/components/common/Avatar";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth/auth";

interface AccountMenuProps {
  user: SessionUser;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Menu da conta"
      >
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-slate-800 leading-none dark:text-slate-200">{user.name}</p>
          <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">@{user.username}</p>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 hidden md:block transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg dark:border-navy-600 dark:bg-navy-800 z-50">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-navy-700 mb-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">@{user.username}</p>
          </div>
          <Link
            href="/perfil"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 transition-colors"
            onClick={() => setOpen(false)}
          >
            Meu perfil
          </Link>
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 transition-colors"
            onClick={() => setOpen(false)}
          >
            Configurações
          </Link>
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-slate-50 dark:text-indigo-400 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 transition-colors"
              onClick={() => setOpen(false)}
            >
              Administração
            </Link>
          )}
          <hr className="my-1 border-slate-100 dark:border-navy-700" />
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-slate-50 dark:text-red-400 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 transition-colors"
            >
              Sair
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
