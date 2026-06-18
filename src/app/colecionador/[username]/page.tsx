import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/database/prisma";
import { Avatar } from "@/components/common/Avatar";
import { getPublicCollectionStats } from "@/modules/dashboard/dashboard.repository";
import { TopCards } from "@/app/dashboard/_components/TopCards";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: { name: true, profilePublic: true },
  });
  if (!user) return { title: "Usuário não encontrado" };
  return { title: user.profilePublic ? `${user.name} — Coleção` : "Perfil privado" };
}

function fmt(d: { toString(): string }): string {
  return `$${Number(d.toString()).toFixed(2)}`;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
      country: true,
      createdAt: true,
      profilePublic: true,
      // NOTE: email, passwordHash, collectionItem.notes/purchasePrices are NOT selected
    },
  });

  if (!user) notFound();

  if (!user.profilePublic) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 text-5xl text-gray-300 dark:text-gray-600">🔒</div>
        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Perfil privado
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          @{user.username} optou por manter sua coleção privada.
        </p>
      </div>
    );
  }

  const stats = await getPublicCollectionStats(user.id);

  return (
    <div className="max-w-2xl space-y-6">
      {/* identity */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
          <div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-gray-500 dark:text-gray-400">@{user.username}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-400 dark:text-gray-500">
              {user.country && <span>🌍 {user.country}</span>}
              <span>
                Membro desde{" "}
                {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* public stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Cartas distintas", value: stats.distinctCards.toLocaleString("pt-BR") },
          { label: "Total de cópias", value: stats.totalCopies.toLocaleString("pt-BR") },
          { label: "Expansões iniciadas", value: stats.setsStarted.toLocaleString("pt-BR") },
          { label: "Valor de mercado", value: fmt(stats.totalValue) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* top cards (market prices only, no purchase prices or notes) */}
      {stats.topCards.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-100">
            Cartas mais valiosas
          </h2>
          <TopCards cards={stats.topCards} />
        </div>
      )}
    </div>
  );
}
