import { NextRequest, NextResponse } from "next/server";
import { LorcastCatalogProvider } from "@/lib/catalog/providers/lorcast.provider";
import { runLorcastSync } from "@/lib/catalog/sync/sync.service";
import { findSyncRunById } from "@/modules/sync/sync.repository";
import { hasSyncRunning } from "@/modules/admin/admin.repository";

export async function POST(req: NextRequest) {
  // Only accept secret via Authorization header — never query string
  const authHeader = req.headers.get("authorization") ?? "";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Cron não configurado" },
      { status: 503 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (await hasSyncRunning()) {
    return NextResponse.json(
      { error: "Sincronização já em andamento" },
      { status: 409 }
    );
  }

  try {
    const provider = new LorcastCatalogProvider();
    const syncRunId = await runLorcastSync(provider, "cron");
    const syncRun = await findSyncRunById(syncRunId);
    return NextResponse.json({ syncRun }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
