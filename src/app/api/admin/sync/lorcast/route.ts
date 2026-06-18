import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { LorcastCatalogProvider } from "@/lib/catalog/providers/lorcast.provider";
import { runLorcastSync } from "@/lib/catalog/sync/sync.service";
import { findSyncRunById } from "@/modules/sync/sync.repository";
import { hasSyncRunning } from "@/modules/admin/admin.repository";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  if (await hasSyncRunning()) {
    return NextResponse.json(
      { error: "Sincronização já em andamento" },
      { status: 409 }
    );
  }

  try {
    const provider = new LorcastCatalogProvider();
    const syncRunId = await runLorcastSync(provider, "admin");
    const syncRun = await findSyncRunById(syncRunId);
    return NextResponse.json({ syncRun }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro inesperado";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
