"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/components/nav-links";
import { cn } from "@/lib/utils";

// NEXT_PUBLIC_* is inlined at build time and safe to read in a client
// component — importing the server `env` object would pull server-only
// secrets (MONGODB_URI, etc.) into the client bundle and throw.
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "PGpoetry";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>

      <DialogContent
        showClose={false}
        className="top-0 right-0 left-auto flex h-dvh max-w-full translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 border-l p-0 shadow-xl sm:max-w-xs data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
      >
        <DialogTitle className="sr-only">Navigation menu</DialogTitle>

        {/* Header: brand + close */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link
            href="/"
            onClick={close}
            className="flex items-center"
            aria-label={`${SITE_NAME} home`}
          >
            <div className="relative size-11 shrink-0">
              <Image
                src="/images/pg_logo.png"
                alt=""
                fill
                className="object-contain"
              />
            </div>
            <span className="-ml-1 font-serif text-lg font-semibold">
              poetry
            </span>
          </Link>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close menu"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </Button>
          </DialogClose>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={cn(
                      "block rounded-lg px-4 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer actions */}
        <div className="bg-card/50 flex flex-col gap-3 border-t p-4">
          {isLoggedIn ? (
            <>
              <Button
                asChild
                variant="outline"
                onClick={close}
                className="justify-start rounded-lg"
              >
                <Link href="/profile">Your profile</Link>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  close();
                  signOut({ callbackUrl: "/" });
                }}
                className="text-muted-foreground hover:text-foreground justify-start gap-2 rounded-lg"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="outline"
                onClick={close}
                className="rounded-lg"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild onClick={close} className="rounded-lg">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
