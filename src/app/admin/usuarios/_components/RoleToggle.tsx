"use client";

import { useTransition } from "react";
import { toggleUserRole } from "../_actions";
import type { Role } from "@prisma/client";

export function RoleToggle({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: Role;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleUserRole(userId, currentRole);
    });
  }

  const isAdmin = currentRole === "ADMIN";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-busy={isPending}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 ${
        isAdmin
          ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
      }`}
      title={isAdmin ? "Clique para tornar usuário comum" : "Clique para promover a admin"}
    >
      {isPending ? "…" : isAdmin ? "ADMIN" : "USER"}
    </button>
  );
}
