import Link from "next/link";
import { env } from "@/lib/env";

const SOCIALS = [
  { label: "TikTok", href: "https://www.tiktok.com/@pg_poeticpen" },
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "X", href: "https://x.com/" },
  { label: "YouTube", href: "https://youtube.com/" },
];

export function SiteFooter() {
  return (
    <footer data-site-footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-xl font-semibold">{env.SITE_NAME}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Every verse, a priceless gift.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold">Explore</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
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
          <p className="text-sm font-semibold">Connect</p>
          <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
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
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} {env.SITE_NAME}. All rights
            reserved.
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
