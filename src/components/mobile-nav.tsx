"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/nav-links";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
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
      <DialogContent className="top-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-sm h-screen flex flex-col gap-0 p-0 data-[state=open]:slide-in-from-left-0 data-[state=closed]:slide-out-to-left-0">
        <div className="bg-card border-b px-6 py-4 flex items-center justify-end">
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </Button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-y-auto">
          <nav className="flex flex-col px-4 py-6">
            <NavLinks orientation="vertical" onNavigate={close} />
          </nav>
        </div>

        <div className="border-t bg-card/50 px-6 py-6 flex flex-col gap-3">
          {isLoggedIn ? (
            <>
              <Link
                href="/profile"
                onClick={close}
                className="px-4 py-3 rounded-lg text-base font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                Your profile
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  close();
                  signOut({ callbackUrl: "/" });
                }}
                className="rounded-lg gap-2 justify-start"
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" onClick={close} className="rounded-lg">
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
