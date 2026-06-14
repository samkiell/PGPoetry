"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PoemSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = React.useState(initial);
  const [pending, startTransition] = React.useTransition();

  // Keep in sync if the URL changes elsewhere, without clobbering active typing.
  const [lastInitial, setLastInitial] = React.useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    if (initial !== value.trim()) setValue(initial);
  }

  const commit = React.useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set("q", next.trim());
      else params.delete("q");
      startTransition(() => {
        router.replace(`/admin/poems?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 300);
  }
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="relative w-full sm:max-w-xs">
      {pending ? (
        <Loader2 className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin" />
      ) : (
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      )}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search poems…"
        className="pl-9"
        aria-label="Search poems"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            if (timer.current) clearTimeout(timer.current);
            setValue("");
            commit("");
          }}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
