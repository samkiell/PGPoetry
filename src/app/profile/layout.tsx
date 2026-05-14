import Link from "next/link";
import { requireUser } from "@/lib/session";

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-braces: the proxy already guards /profile/*.
  await requireUser("/profile");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <nav className="mb-8 flex gap-1 border-b">
        <ProfileTab href="/profile" label="Overview" />
        <ProfileTab href="/profile/favorites" label="Favorites" />
      </nav>
      {children}
    </div>
  );
}

function ProfileTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-4 py-2 text-sm font-medium hover:border-border"
    >
      {label}
    </Link>
  );
}
