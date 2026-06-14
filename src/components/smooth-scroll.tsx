"use client";

import * as React from "react";
import Lenis from "lenis";

/**
 * App-wide smooth (momentum) scrolling via Lenis. Mounted once in the root
 * layout. Skips entirely for users who prefer reduced motion, leaving native
 * scrolling intact.
 */
export function SmoothScroll() {
  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({
      // Pronounced, glide-y momentum.
      duration: 1.3,
      easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
      smoothWheel: true,
      // Slightly amplify wheel input so the glide is noticeable.
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
