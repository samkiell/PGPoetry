import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a given page number, preserving other query params. */
  hrefFor: (page: number) => string;
}

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  return (
    <nav
      className="flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      {hasPrev ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <ChevronLeft className="size-4" /> Previous
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50",
          )}
        >
          <ChevronLeft className="size-4" /> Previous
        </span>
      )}

      <span className="text-muted-foreground px-2 text-sm">
        Page {page} of {pageCount}
      </span>

      {hasNext ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Next <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "pointer-events-none opacity-50",
          )}
        >
          Next <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
