"use client";

import * as React from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeUserRole,
  removeUser,
  type UserRole,
} from "@/app/actions/admin";
import type { AdminUserRow } from "@/lib/data/admin";

export function UsersManager({ users }: { users: AdminUserRow[] }) {
  const [pending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const res = await changeUserRole(userId, newRole);
      if (res.ok) {
        toast.success("User role updated");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (
      !confirm(
        `Are you sure you want to delete @${username}? This cannot be undone.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await removeUser(userId);
      if (res.ok) {
        toast.success("User deleted");
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left px-4 py-3 font-semibold">Name</th>
            <th className="text-left px-4 py-3 font-semibold">Username</th>
            <th className="text-left px-4 py-3 font-semibold">Email</th>
            <th className="text-left px-4 py-3 font-semibold">Role</th>
            <th className="text-left px-4 py-3 font-semibold">Joined</th>
            <th className="text-right px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-accent/50 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium">{user.name || "—"}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                @{user.username || "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {user.email}
              </td>
              <td className="px-4 py-3">
                <Select
                  value={user.role}
                  onValueChange={(value) =>
                    handleRoleChange(user.id, value as UserRole)
                  }
                  disabled={pending}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Reader</SelectItem>
                    <SelectItem value="writer">Writer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.username)}
                  disabled={pending}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  );
}
