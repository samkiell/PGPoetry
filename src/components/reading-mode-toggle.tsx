"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Toggles a `reading-mode` class on `<html>`. Global CSS uses that class to
 * hide the site chrome (header/footer) and anything tagged `.reading-hide`,
 * leaving just the poem on the page.
 *
 * The "enter" button lives inline (and is itself inside a `.reading-hide`
 * region, so it disappears once active — that's fine). The "exit" button is
 * portalled to <body> so it escapes that hidden subtree and stays visible.
 * Escape also exits.
 */
export function ReadingModeToggle() {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    if (active) root.classList.add("reading-mode");
    else root.classList.remove("reading-mode");
    return () => root.classList.remove("reading-mode");
  }, [active]);

  React.useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setActive(true)}
        className="text-muted-foreground hover:text-foreground gap-1.5"
        aria-label="Enter reading mode"
      >
        <BookOpen className="size-3.5" />
        Reading mode
      </Button>

      {/* Portalled to <body> so the hidden `.reading-hide` parent can't take it
          down with it. Only ever rendered after a client click (active starts
          false), so document.body is guaranteed present — no SSR guard needed. */}
      {active
        ? createPortal(
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActive(false)}
              className="bg-background/90 fixed top-4 right-4 z-[60] shadow-md backdrop-blur-sm"
              aria-label="Exit reading mode"
            >
              <X className="size-4" />
              Exit reading mode
            </Button>,
            document.body,
          )
        : null}
    </>
  );
}
