import Link from "next/link";
import { Feather } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-md flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="bg-primary text-primary-foreground grid size-10 place-items-center rounded-lg">
          <Feather className="size-5" />
        </span>
        <span className="font-serif text-xl font-semibold">PGpoetry</span>
      </Link>

      <div className="bg-card rounded-xl border p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>

      <p className="text-muted-foreground mt-6 text-center text-sm">{footer}</p>
    </div>
  );
}
