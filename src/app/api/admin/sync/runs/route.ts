import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/auth";
import { findAllSyncRuns } from "@/modules/sync/sync.repository";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const runs = await findAllSyncRuns();
  return NextResponse.json({ runs });
}
