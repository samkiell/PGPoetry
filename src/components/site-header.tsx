import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header
      data-site-header
      className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-2 sm:px-6">
        <Link href="/" className="flex items-center">
          <div className="relative size-16 shrink-0">
            <Image
              src="/images/pg_logo.png"
              alt="PGpoetry Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span className="-ml-2 flex flex-col leading-none">
            {/* Logo already shows the "PG" monogram, so the wordmark is just
                "poetry". */}
            <span className="font-serif text-lg font-semibold">poetry</span>
            <span className="text-muted-foreground hidden text-[11px] sm:block">
              Every verse, a priceless gift.
            </span>
          </span>
        </Link>

        <div className="ml-4 hidden md:block">
          <NavLinks />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <UserMenu user={user} />
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
          <MobileNav isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </header>
  );
}
