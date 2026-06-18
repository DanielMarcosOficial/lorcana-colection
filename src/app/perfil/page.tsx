import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/auth";
import { Avatar } from "@/components/common/Avatar";
import { getCollectionStats } from "@/modules/collection/collection.repository";
import { getCollectionValue, getTopValueCards } from "@/modules/dashboard/dashboard.repository";
import { TopCards } from "@/app/dashboard/_components/TopCards";

export const metadata: Metadata = { title: "Meu Perfil" };

function fmt(d: { toString(): string }): string {
  return `$${Number(d.toString()).toFixed(2)}`;
}

export default async function PerfilPage() {
  const user = await requireUser();

  const [stats, value, topCards] = await Promise.all([
    getCollectionStats(user.id),
    getCollectionValue(user.id),
    getTopValueCards(user.id, 5),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>

      {/* identity card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
          <div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      {/* collection summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Cartas distintas", value: stats.distinctCards.toLocaleString("pt-BR") },
          { label: "Total de cópias", value: stats.totalCopies.toLocaleString("pt-BR") },
          { label: "Expansões", value: stats.setsStarted.toLocaleString("pt-BR") },
          { label: "Valor total", value: fmt(value.total) },
        ].map(({ label, value: v }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{v}</p>
          </div>
        ))}
      </div>

      {/* top cards */}
      {topCards.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
            Cartas mais valiosas
          </h2>
          <TopCards cards={topCards} />
        </div>
      )}
    </div>
  );
}
