import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-7xl font-semibold text-primary">404</p>
      <h1 className="font-serif text-2xl font-medium">
        This page slipped between the lines.
      </h1>
      <p className="text-muted-foreground">
        The poem or page you&apos;re looking for isn&apos;t here.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back home
      </Link>
    </main>
  );
}
