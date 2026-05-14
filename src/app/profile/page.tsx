import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/session";
import { getUserProfile } from "@/lib/data/users";
import { getCommentsByUser } from "@/lib/data/comments";
import { getFavoriteCount } from "@/lib/data/favorites";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage() {
  const session = await requireUser("/profile");
  const [profile, comments, favoriteCount] = await Promise.all([
    getUserProfile(session.id),
    getCommentsByUser(session.id, 10),
    getFavoriteCount(session.id),
  ]);

  if (!profile) notFound();

  return (
    <div className="flex flex-col gap-8">
      {/* Identity */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16">
          {profile.image ? (
            <AvatarImage src={profile.image} alt={profile.name} />
          ) : null}
          <AvatarFallback className="text-lg">
            {(profile.name || profile.email).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            {profile.name || profile.username}
          </h1>
          <p className="text-muted-foreground text-sm">
            @{profile.username || "reader"} · Joined{" "}
            {formatDate(profile.joinedAt)}
          </p>
          <div className="mt-2 flex gap-2">
            {profile.role === "admin" ? <Badge>Admin</Badge> : null}
            <Badge variant="secondary">{favoriteCount} favorites</Badge>
            <Badge variant="secondary">{comments.length} comments</Badge>
          </div>
        </div>
      </div>

      {/* Edit details */}
      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm name={profile.name} bio={profile.bio} />
        </CardContent>
      </Card>

      {/* Recent comments */}
      <section>
        <h2 className="font-serif mb-4 text-xl font-semibold">
          Your recent comments
        </h2>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            You haven&apos;t commented on any poems yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border p-4">
                {comment.poem ? (
                  <Link
                    href={`/poems/${comment.poem.slug}`}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    {comment.poem.title}
                  </Link>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    (poem removed)
                  </span>
                )}
                <p className="poem-body mt-1 text-sm">{comment.text}</p>
                <p className="text-muted-foreground mt-2 text-xs">
                  {formatDate(comment.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
