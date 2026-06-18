import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
        Sua coleção{" "}
        <span className="text-indigo-600">Disney Lorcana</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
        Organize, acompanhe e avalie sua coleção de cartas Disney Lorcana de
        forma simples e eficiente.
      </p>
      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link
          href="/cadastro"
          className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        >
          Começar agora
        </Link>
        <Link
          href="/entrar"
          className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
