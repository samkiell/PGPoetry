"use client";

import * as React from "react";
import { useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PoemsFilterProps {
  tags: { tag: string; count: number }[];
  activeTag?: string;
  query?: string;
}

export function PoemsFilter({ tags, activeTag, query }: PoemsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(query ?? "");
  const [tagsExpanded, setTagsExpanded] = React.useState(false);
  const [pending, startTransition] = useTransition();

  // Keep the input in sync when the URL query changes from elsewhere — back
  // button, "Clear filters" — but never clobber what the user is mid-way
  // through typing (live search lags the input behind the committed query).
  // Adjusting state during render rather than in an effect avoids an extra
  // commit and the cascading-render the react-hooks rule warns about.
  const [lastQuery, setLastQuery] = React.useState(query ?? "");
  if ((query ?? "") !== lastQuery) {
    setLastQuery(query ?? "");
    // Only adopt the external value if the user isn't actively editing toward
    // it; if it already matches what's typed, there's nothing to sync.
    if ((query ?? "") !== value.trim()) setValue(query ?? "");
  }

  const commit = React.useCallback(
    (
      next: { q?: string | null; tag?: string | null },
      mode: "push" | "replace" = "push",
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.q !== undefined) {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
      }
      if (next.tag !== undefined) {
        if (next.tag) params.set("tag", next.tag);
        else params.delete("tag");
      }
      // Any filter change resets pagination.
      params.delete("page");
      const url = `${pathname}?${params.toString()}`;
      startTransition(() => {
        // Replace (not push) for live typing so the back button skips over
        // every intermediate keystroke; explicit actions still push.
        if (mode === "replace") router.replace(url);
        else router.push(url);
      });
    },
    [searchParams, pathname, router],
  );

  // Search as the user types, debounced so we don't fire a request per
  // keystroke. The timer is cleared on each change and on unmount.
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleSearchChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      commit({ q: next.trim() || null }, "replace");
    }, 350);
  }
  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          // Submitting jumps past the debounce and pushes a history entry.
          if (timer.current) clearTimeout(timer.current);
          commit({ q: value.trim() || null });
        }}
        className="relative"
      >
        {pending ? (
          <Loader2 className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin" />
        ) : (
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        )}
        <Input
          value={value}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search poems by title, line, or tag…"
          className="pl-9"
          aria-label="Search poems"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              if (timer.current) clearTimeout(timer.current);
              setValue("");
              commit({ q: null });
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </form>

      {tags.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => commit({ tag: null })}>
              <Badge
                variant={activeTag ? "secondary" : "default"}
                className="cursor-pointer"
              >
                All
              </Badge>
            </button>
            {tags.slice(0, 5).map(({ tag, count }) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => commit({ tag: active ? null : tag })}
                >
                  <Badge
                    variant={active ? "default" : "secondary"}
                    className={cn("cursor-pointer", active && "ring-1 ring-ring")}
                  >
                    {tag}
                    <span className="ml-1 opacity-60">{count}</span>
                  </Badge>
                </button>
              );
            })}
          </div>
          {tags.length > 5 && (
            <button
              type="button"
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 w-fit"
            >
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  tagsExpanded && "rotate-180"
                )}
              />
              {tagsExpanded ? "Show less" : "Show all tags"}
            </button>
          )}
          {tagsExpanded && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(5).map(({ tag, count }) => {
                const active = activeTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => commit({ tag: active ? null : tag })}
                  >
                    <Badge
                      variant={active ? "default" : "secondary"}
                      className={cn("cursor-pointer", active && "ring-1 ring-ring")}
                    >
                      {tag}
                      <span className="ml-1 opacity-60">{count}</span>
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {(activeTag || query) && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>
            {query ? `Results for “${query}”` : null}
            {query && activeTag ? " · " : null}
            {activeTag ? `Tagged “${activeTag}”` : null}
          </span>
          <Link
            href={pathname}
            className="text-primary text-xs font-medium hover:underline"
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
