import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { env } from "@/lib/env";

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@pg_poeticpen" },
  { label: "Instagram", href: "https://www.instagram.com/joyeke.pg/" },
  { label: "X", href: "https://x.com/Jossyy31" },
];

export async function SiteFooter() {
  const user = await getCurrentUser();

  return (
    <footer data-site-footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 grid-cols-2 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center">
            <div className="relative size-12 shrink-0">
              <Image
                src="/images/pg_logo.png"
                alt="PGpoetry Logo"
                fill
                className="object-contain"
              />
            </div>
            <p className="-ml-1 font-serif text-lg sm:text-xl font-semibold">
              poetry
            </p>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Every verse, a priceless gift.
          </p>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold">Explore</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-xs sm:text-sm">
            <li>
              <Link href="/poems" className="hover:text-foreground">
                All poems
              </Link>
            </li>
            <li>
              <Link href="/collections" className="hover:text-foreground">
                Collections
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold">
            {user ? "Account" : "Get started"}
          </p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-xs sm:text-sm">
            {user ? (
              <li>
                <Link href="/profile" className="hover:text-foreground">
                  Your profile
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link href="/login" className="hover:text-foreground">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-foreground">
                    Sign up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <p className="text-xs sm:text-sm font-semibold">Contact us</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-xs sm:text-sm">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-row items-center justify-between gap-2 px-4 py-6 text-xs sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {env.SITE_NAME}. All rights reserved.
          </p>
          <p>
            <a
              href="https://samkiel.tech/agency"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#ccff00] transition-colors hover:text-foreground"
            >
              <Image
                src="/images/SAMKIEL_ICON.png"
                alt="SAMKIEL logo"
                width={16}
                height={16}
                className="h-[1em] w-auto"
              />
              SAMKIEL
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
