"use client";

import * as React from "react";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Toggles a `reading-mode` class on `<html>`. Global CSS uses that class to
 * hide the site chrome (header/footer) and anything tagged `.reading-hide`,
 * leaving just the poem on the page. Press Escape to exit.
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

  if (active) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setActive(false)}
        className="bg-background/90 fixed top-4 right-4 z-50 backdrop-blur-sm"
        aria-label="Exit reading mode"
      >
        <X className="size-4" />
        Exit reading mode
      </Button>
    );
  }

  return (
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
  );
}
