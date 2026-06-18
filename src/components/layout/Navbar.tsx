import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth";
import { AccountMenu } from "./AccountMenu";
import { NavbarMobile } from "./NavbarMobile";
import { NavLinks } from "./NavLinks";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-navy-600 dark:bg-navy-800/90">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            aria-label="Lorcana Coleção"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="hidden text-lg font-bold text-slate-900 dark:text-slate-100 sm:inline">
              Lorcana
            </span>
          </Link>
          {user && <NavLinks />}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <div className="hidden md:block">
                <AccountMenu user={user} />
              </div>
              <NavbarMobile user={user} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/entrar"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors shadow-sm"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
