"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

// Returns false during SSR / first client render, true once hydrated — without
// a setState-in-effect (which React now flags as cascading-render-prone).
function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

// Click cycles through these in order, wrapping back to the start.
const CYCLE = ["system", "light", "dark"] as const;

const ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const current = (mounted ? (theme ?? "system") : "system") as
    (typeof CYCLE)[number];
  const Icon = ICONS[current] ?? Sun;

  const cycle = () => {
    const next = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];
    setTheme(next);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Theme: ${current}. Click to change.`}
      title={`Theme: ${current}`}
      onClick={cycle}
    >
      <Icon className="size-[1.1rem]" />
    </Button>
  );
}
