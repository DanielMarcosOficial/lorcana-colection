"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/auth";
import { setUserRole } from "@/modules/admin/admin.repository";
import type { Role } from "@prisma/client";

export async function toggleUserRole(
  userId: string,
  currentRole: Role
): Promise<{ error?: string }> {
  const me = await requireAdmin();
  if (me.id === userId) {
    return { error: "Você não pode alterar seu próprio papel" };
  }
  const newRole: Role = currentRole === "ADMIN" ? "USER" : "ADMIN";
  await setUserRole(userId, newRole);
  revalidatePath("/admin/usuarios");
  return {};
}
