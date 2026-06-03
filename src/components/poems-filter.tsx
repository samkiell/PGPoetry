"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
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

  // Keep the input in sync if the URL changes from elsewhere (e.g. back button).
  React.useEffect(() => setValue(query ?? ""), [query]);

  function commit(next: { q?: string | null; tag?: string | null }) {
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
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit({ q: value.trim() || null });
        }}
        className="relative"
      >
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search poems by title, line, or tag…"
          className="pl-9"
          aria-label="Search poems"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
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
          <button
            type="button"
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className="flex items-center gap-2 text-sm font-medium hover:opacity-80"
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                tagsExpanded && "rotate-180"
              )}
            />
            Browse tags
          </button>
          {tagsExpanded && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => commit({ tag: null })}>
                <Badge
                  variant={activeTag ? "secondary" : "default"}
                  className="cursor-pointer"
                >
                  All
                </Badge>
              </button>
              {tags.map(({ tag, count }) => {
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
                      <span className="opacity-60">{count}</span>
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
