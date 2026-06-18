import type { Metadata } from "next";
import { listUsers } from "@/modules/admin/admin.repository";
import { RoleToggle } from "./_components/RoleToggle";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
  const { users, total, totalPages } = await listUsers(page, 25);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Usuários
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {total.toLocaleString("pt-BR")} usuário{total !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {["Nome", "Username", "Email", "Cartas", "Papel", "Desde"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {user.name}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  @{user.username}
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {user._count.collectionItems.toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-3">
                  <RoleToggle userId={user.id} currentRole={user.role} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2"
          aria-label="Paginação de usuários"
        >
          {page > 1 && (
            <a
              href={`/admin/usuarios?page=${page - 1}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Anterior
            </a>
          )}
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <a
              href={`/admin/usuarios?page=${page + 1}`}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            >
              Próxima
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
