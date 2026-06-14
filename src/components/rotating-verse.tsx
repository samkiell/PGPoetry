"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Short, evocative lines shown in the hero eyebrow. Edit freely — keep them
 * brief so they sit on one line and read as a fragment, not a full poem.
 */
const VERSES = [
  "Some lines find you before you need them.",
  "Grief, rearranged into something you can hold.",
  "Every verse, a quiet act of keeping.",
  "Read slowly. Let it stay.",
  "The words you didn't know you were missing.",
] as const;

const INTERVAL_MS = 4000;

export function RotatingVerse() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion || VERSES.length <= 1) return;

    const tick = setInterval(() => {
      // Fade out, swap the line mid-fade, then fade back in.
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % VERSES.length);
        setVisible(true);
      }, 400);
      return () => clearTimeout(swap);
    }, INTERVAL_MS);

    return () => clearInterval(tick);
  }, []);

  return (
    <span
      className={cn(
        "text-muted-foreground block min-h-[1.5em] text-xs font-medium uppercase tracking-[0.3em] transition-opacity duration-500 sm:text-sm",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {VERSES[index]}
    </span>
  );
}
