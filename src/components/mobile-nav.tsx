"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
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
      <DialogContent className="top-0 left-0 max-w-full translate-x-0 translate-y-0 rounded-none border-0 sm:max-w-sm">
        <DialogTitle className="text-primary">PGpoetry</DialogTitle>
        <NavLinks orientation="vertical" onNavigate={close} />
        <div className="mt-4 flex flex-col gap-2 border-t pt-4">
          {isLoggedIn ? (
            <Link
              href="/profile"
              onClick={close}
              className="px-3 py-2 text-base font-medium text-muted-foreground hover:text-foreground"
            >
              Your profile
            </Link>
          ) : (
            <>
              <Button asChild variant="outline" onClick={close}>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild onClick={close}>
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
