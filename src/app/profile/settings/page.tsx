import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/profile/settings-form";
import { requireUser } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireUser("/profile/settings");
  await connectDB();

  const user = await User.findById(session.id).select("+password");
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account & Security</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            email={user.email}
            username={user.username || ""}
            hasPassword={!!user.password}
          />
        </CardContent>
      </Card>
    </div>
  );
}
