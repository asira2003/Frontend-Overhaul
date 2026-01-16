"use client";

export default function UserTable({ users = [], loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-neutral-400">
        Loading users…
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-700 p-12 text-center text-neutral-400">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-800 shadow-card">
      <div className="max-h-[60vh] overflow-auto">
        <table className="min-w-full divide-y divide-neutral-800">
          <thead className="sticky top-0 bg-neutral-950/80 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/60">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 bg-neutral-950">
            {users.map((u, idx) => (
              <tr key={u.id ?? idx} className="hover:bg-neutral-900/40">
                <td className="px-4 py-3 text-sm text-neutral-200">
                  {u.name ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-300">
                  {u.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-300">
                  {u.role ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-400">
                  {u.createdAt ? new Date(u.createdAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
