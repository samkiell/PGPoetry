import Link from "next/link";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Library,
  ExternalLink,
} from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { publishDuePoems } from "@/lib/data/admin";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/poems", label: "Poems", icon: FileText },
  { href: "/admin/collections", label: "Collections", icon: Library },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  // Promote any scheduled poems whose time has come, on every admin visit.
  await publishDuePoems();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
      <aside className="md:w-52 md:shrink-0">
        <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wide">
          Admin studio
        </p>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors"
          >
            <ExternalLink className="size-4" />
            View site
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
