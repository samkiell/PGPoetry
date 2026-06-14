import Link from "next/link";
import Image from "next/image";

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
      <Link href="/" className="mb-8 flex items-center justify-center">
        <div className="relative size-12 shrink-0">
          <Image
            src="/images/pg_logo.png"
            alt="PGpoetry Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="-ml-1 font-serif text-xl font-semibold">poetry</span>
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
