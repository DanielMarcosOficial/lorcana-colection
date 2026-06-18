import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/auth";
import { RegisterForm } from "./_components/RegisterForm";

export const metadata: Metadata = { title: "Cadastro" };

export default async function CadastroPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Criar conta</h1>
          <p className="mt-2 text-gray-500">Comece a gerenciar sua coleção</p>
        </div>
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem uma conta?{" "}
          <Link
            href="/entrar"
            className="font-medium text-indigo-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
