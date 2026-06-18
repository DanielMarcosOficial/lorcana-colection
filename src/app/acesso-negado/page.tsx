import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Acesso Negado" };

export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-red-500">403</p>
      <h1 className="mt-4 text-2xl font-bold">Acesso Negado</h1>
      <p className="mt-2 text-gray-500">
        Você não tem permissão para acessar esta página.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
      >
        Ir para o Dashboard
      </Link>
    </div>
  );
}
