import type { Metadata } from "next";
import { Users } from "lucide-react";
import { UsersManager } from "@/components/admin/users-manager";
import { getAllUsers } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Users — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="size-6" />
          <h1 className="text-2xl font-semibold">Users</h1>
        </div>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions.
        </p>
      </div>

      <div className="rounded-lg border">
        <UsersManager users={users} />
      </div>

      <div className="text-xs text-muted-foreground bg-card p-4 rounded-lg">
        <p className="font-semibold mb-2">User Roles:</p>
        <ul className="space-y-1">
          <li>
            <strong>Reader</strong> — Can view poems and favorite them, leave comments
          </li>
          <li>
            <strong>Writer</strong> — Can create and manage their own poems
          </li>
          <li>
            <strong>Admin</strong> — Full access to admin panel and all user management
          </li>
        </ul>
      </div>
    </div>
  );
}
