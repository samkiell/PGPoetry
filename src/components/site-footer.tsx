import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { env } from "@/lib/env";

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@pg_poeticpen" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
];

export async function SiteFooter() {
  const user = await getCurrentUser();

  return (
    <footer data-site-footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 grid-cols-2 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-serif text-lg sm:text-xl font-semibold">{env.SITE_NAME}</p>
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
            Developed by{" "}
            <a
              href="https://samkiel.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              SAMKIEL
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
