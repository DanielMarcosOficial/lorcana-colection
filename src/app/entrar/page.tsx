import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import { LoginForm } from "./_components/LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function EntrarPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-md">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-navy-300">Entre na sua conta</p>
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-navy-600 dark:bg-navy-800">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-navy-300">
          Não tem uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-medium text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded dark:text-indigo-400"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
