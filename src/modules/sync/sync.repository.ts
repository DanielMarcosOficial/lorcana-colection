import { Prisma, SyncStatus } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";

export async function createSyncRun(source: string) {
  return prisma.syncRun.create({
    data: { source, status: "RUNNING" },
  });
}

export interface SyncRunUpdate {
  status?: SyncStatus;
  finishedAt?: Date;
  setsCreated?: number;
  setsUpdated?: number;
  cardsCreated?: number;
  cardsUpdated?: number;
  cardsSkipped?: number;
  errorCount?: number;
  metadata?: Prisma.InputJsonValue;
}

export async function updateSyncRun(id: string, data: SyncRunUpdate) {
  return prisma.syncRun.update({ where: { id }, data });
}

export async function createSyncError(params: {
  syncRunId: string;
  entityType: string;
  externalId?: string;
  message: string;
  details?: Prisma.InputJsonValue;
}) {
  return prisma.syncError.create({ data: params });
}

export async function findSyncRunById(id: string) {
  return prisma.syncRun.findUnique({
    where: { id },
    include: { errors: { orderBy: { createdAt: "asc" } } },
  });
}

export async function findAllSyncRuns(limit = 20) {
  return prisma.syncRun.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: { _count: { select: { errors: true } } },
  });
}
