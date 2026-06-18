import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/auth";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireUser();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>
      <p className="mt-1 text-gray-500">
        Gerencie as configurações da sua conta.
      </p>

      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-gray-500">
          Configurações serão implementadas em breve.
        </p>
      </div>
    </div>
  );
}
