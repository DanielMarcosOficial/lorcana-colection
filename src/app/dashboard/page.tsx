import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/auth";
import { getCollectionStats } from "@/modules/collection/collection.repository";
import {
  getCollectionValue,
  getTopValueCards,
  getRecentlyAddedCards,
  getExpansionProgress,
  getInkDistribution,
  getRarityDistribution,
  getValueEvolution,
} from "@/modules/dashboard/dashboard.repository";
import { DashboardStats } from "./_components/DashboardStats";
import { TopCards } from "./_components/TopCards";
import { RecentCards } from "./_components/RecentCards";
import { ExpansionProgress } from "./_components/ExpansionProgress";
import { DistributionChart } from "./_components/DistributionChart";
import { ValueEvolution } from "./_components/ValueEvolution";

export const metadata: Metadata = { title: "Dashboard" };

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-5 dark:border-navy-600 dark:bg-navy-800 ${className ?? ""}`}>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-navy-300">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    collStats,
    value,
    topCards,
    recentCards,
    expansionProgress,
    inkDist,
    rarityDist,
    valueEvolution,
  ] = await Promise.all([
    getCollectionStats(user.id),
    getCollectionValue(user.id),
    getTopValueCards(user.id, 5),
    getRecentlyAddedCards(user.id, 5),
    getExpansionProgress(user.id),
    getInkDistribution(user.id),
    getRarityDistribution(user.id),
    getValueEvolution(user.id, 30),
  ]);

  const startedSets = expansionProgress.filter((r) => r.ownedCount > 0);
  const mostComplete = [...startedSets]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-navy-300">
            Bem-vindo de volta, {user.name.split(" ")[0]}!
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <DashboardStats collStats={collStats} value={value} />

      {/* 2-column grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Cartas mais valiosas">
          <TopCards cards={topCards} />
        </Section>

        <Section title="Adicionadas recentemente">
          <RecentCards items={recentCards} />
        </Section>

        <Section title="Evolução do valor">
          <ValueEvolution points={valueEvolution} />
        </Section>

        <Section title="Distribuição por tinta">
          <DistributionChart rows={inkDist} type="ink" />
        </Section>

        <Section title="Distribuição por raridade">
          <DistributionChart rows={rarityDist} type="rarity" />
        </Section>

        <Section title="Expansões mais completas">
          <ExpansionProgress rows={mostComplete} showAll />
        </Section>
      </div>

      {/* Full-width expansion progress */}
      <Section title={`Progresso por expansão — ${startedSets.length} iniciada${startedSets.length !== 1 ? "s" : ""}`}>
        <ExpansionProgress rows={startedSets} showAll />
      </Section>
    </div>
  );
}
